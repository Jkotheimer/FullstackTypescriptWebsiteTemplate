/**
 * @description Gulpfile for compiling SCSS to minified CSS, compiling TS to minified JS, and copying images and dependencies to the build/ directory
 */
import readDotEnv from './scripts/read-dot-env.js';
import beautifyCode from 'gulp-beautify-code';
import autoprefixer from 'gulp-autoprefixer';
import environments from 'gulp-environments';
import sourcemaps from 'gulp-sourcemaps';
import typescript from 'gulp-typescript';
import select from '@inquirer/select';
import webpack from 'webpack-stream';
import cssnano from 'gulp-cssnano';
import gulpSass from 'gulp-sass';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import readline from 'readline';
import rsync from 'gulp-rsync';
import clean from 'gulp-clean';
import * as sass from 'sass';
import crypto from 'crypto';
import gulp from 'gulp';
import path from 'path';
import url from 'url';
import fs from 'fs';
import os from 'os';

// Converted from CommonJS to ESM
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Environment vars
const isDevelopment = environments.development;
const isProduction = environments.production;
const DOT_ENV = path.resolve(__dirname, '.env');
const ENV_CONFIG = readDotEnv('.env');
process.env.NODE_ENV = isProduction() ? 'production' : 'development';
const env = {
    APP_NAME: process.env.APP_NAME ?? 'website',
    OUT_DIR: process.env.OUT_DIR ?? 'build',
    IS_WORKFLOW: !!process.env.IS_WORKFLOW
};

// Define source directories
const SRC_DIR = path.resolve(__dirname, 'src');

// Define output directories
const REMOTE_OUTPUT_DIR = path.join('/srv/http/', env.APP_NAME);
const LOCAL_OUTPUT_DIR = path.resolve(__dirname, env.OUT_DIR);

if (!fs.existsSync(LOCAL_OUTPUT_DIR)) {
    fs.mkdirSync(LOCAL_OUTPUT_DIR);
}

// Whacky zany cache busting for loading the webpack.config.js module more than once after it's been updated (in watch mode)
let cacheBuster = 0;

// Configuration for beautifying code
const BEAUTIFY_CONFIG = {
    indent_size: 4,
    indent_char: ' '
};

/**
 * ----------------------------------------------
 * -------------- HELPER FUNCTIONS --------------
 * ----------------------------------------------
 */

/**
 * @description Awaits the end of a stream and executes a callback function
 * @param {NodeJS.ReadWriteStream} stream Stream to await
 * @param {function} callback Function to execute after stream ends
 * @returns {Promise<void>}
 */
async function awaitStream(stream, callback) {
    return new Promise((resolve) => {
        try {
            stream.addListener('end', (error) => {
                callback(error);
                resolve();
            });
        } catch (error) {
            callback(error);
            resolve();
        }
    });
}

/**
 * @description Prompts the user for input in the terminal
 * @param {string} question Question to prompt the user in the terminal
 * @returns {Promise<string>} Resolves the user's input
 */
async function prompt(question) {
    const readlineInterface = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise((resolve) => {
        readlineInterface.question(question, (answer) => {
            readlineInterface.close();
            resolve(answer);
        });
    });
}

/**
 * @description Generates an MD5 hash of a file or folder. This is used to get a unique version identifier of each code revision
 * @param {string} fileOrFolderPath Path of file or folder to hash the contents of
 * @returns {string} MD5 has of the contents of the file/folder
 */
function hashFileOrFolder(fileOrFolderPath) {
    const hash = crypto.createHash('md5');
    const addFilePath = (currentFilePath) => {
        if (fs.statSync(currentFilePath).isFile()) {
            hash.update(fs.readFileSync(currentFilePath));
            return;
        }
        fs.readdirSync(currentFilePath)
            .sort()
            .forEach((file) => addFilePath(path.join(currentFilePath, file)));
    };
    addFilePath(fileOrFolderPath);
    return hash.digest('hex');
}

/**
 * ----------------------------------------------
 * -------------- OUTPUT SANITIZERS -------------
 * ----------------------------------------------
 */

/**
 * @description Cleans the output directory of all files
 * @returns {NodeJS.ReadWriteStream}
 */
function clearOutputDir() {
    return gulp.src(path.resolve(LOCAL_OUTPUT_DIR, '*'), { read: false }).pipe(clean());
}

/**
 * @description Cleans the output directory of all files except minified files
 * @returns {NodeJS.ReadWriteStream}
 */
function cleanOutputDir() {
    return gulp
        .src([path.resolve(LOCAL_OUTPUT_DIR, 'js/**/*.js'), `!${path.resolve(LOCAL_OUTPUT_DIR, 'js/**/*.min.js')}`], {
            read: false
        })
        .pipe(clean());
}

/**
 * ----------------------------------------------
 * -------------- COPY / COMPILE ----------------
 * ----------------------------------------------
 */

/**
 * @description Copies all images from the source directory to the output directory
 * @returns {NodeJS.ReadWriteStream}
 */
function copyImages() {
    return gulp
        .src([path.resolve(SRC_DIR, 'images/*'), `!${path.resolve(SRC_DIR, 'images/*.d.ts')}`])
        .pipe(gulp.dest(path.resolve(LOCAL_OUTPUT_DIR, 'images')));
}

/**
 * @description Compiles all SCSS files to CSS
 * @returns {NodeJS.ReadWriteStream}
 */
function compileSass() {
    return gulp
        .src(path.resolve(SRC_DIR, 'scss/*.scss'))
        .pipe(gulpSass(sass)())
        .pipe(
            autoprefixer({
                cascade: false,
                remove: false
            })
        )
        .pipe(beautifyCode(BEAUTIFY_CONFIG))
        .pipe(gulp.dest(path.resolve(LOCAL_OUTPUT_DIR, 'css')));
}

/**
 * @description Compiles all TS files to JS and bundles react dependencies using webpack
 * @see tsconfig.json for TypeScript configuration
 * @see webpack.config.js for Webpack configuration
 * @param {function} callback - Callback function to execute after compilation
 * @returns {Promise<void>}
 */
async function compileTs(callback) {
    const tsProject = typescript.createProject('tsconfig.json');
    const webpackConfig = await import(`./webpack.config.js?${cacheBuster++}`);
    const stream = tsProject
        .src()
        .pipe(tsProject())
        .js.pipe(webpack(webpackConfig.default))
        .pipe(beautifyCode(BEAUTIFY_CONFIG))
        .pipe(gulp.dest(path.resolve(LOCAL_OUTPUT_DIR, 'js')));
    return awaitStream(stream, callback);
}

/**
 * ----------------------------------------------
 * ---------------- MINIFIERS -------------------
 * ----------------------------------------------
 */

/**
 * @description Minifies all CSS files
 * @returns {NodeJS.ReadWriteStream}
 */
function minifyCss() {
    return gulp
        .src([path.resolve(LOCAL_OUTPUT_DIR, 'css/*.css'), `!${path.resolve(LOCAL_OUTPUT_DIR, 'css/*.min.css')}`])
        .pipe(sourcemaps.init())
        .pipe(
            cssnano({
                autoprefixer: {
                    remove: false
                }
            })
        )
        .pipe(
            rename({
                suffix: '.min'
            })
        )
        .pipe(sourcemaps.write('maps'))
        .pipe(gulp.dest(path.resolve(LOCAL_OUTPUT_DIR, 'css')));
}

/**
 * @description Minifies all JS files
 * @returns {NodeJS.ReadWriteStream}
 */
function minifyJs() {
    return gulp
        .src([
            path.resolve(LOCAL_OUTPUT_DIR, 'js/**/*.js'),
            `!${path.resolve(LOCAL_OUTPUT_DIR, 'js/**/*.min.js')}`,
            `!${path.resolve(LOCAL_OUTPUT_DIR, 'js/lib/*.js')}`
        ])
        .pipe(isDevelopment(sourcemaps.init()))
        .pipe(isProduction(uglify()))
        .pipe(
            rename({
                suffix: '.min'
            })
        )
        .pipe(isDevelopment(sourcemaps.write('maps')))
        .pipe(gulp.dest(path.resolve(LOCAL_OUTPUT_DIR, 'js')));
}

/**
 * ----------------------------------------------
 * ------- LOCAL DEVELOPMENT ENVIRONMENT --------
 * ----------------------------------------------
 */

/**
 * @description TODO
 * @param {function} callback - Callback function to execute after symlink
 * @returns {Promise<void>}
 */
async function symlinkOutputDir(callback) {
    // TODO : figure out how to create this symlink on static directories - use docker?
    const stream = gulp.src(OUTPUT_DIR).pipe(gulp.symlink(OUTPUT_DIR));
    return awaitStream(stream, callback);
}

/**
 * @description Watches for changes in the source directory and runs the appropriate task
 */
function watch() {
    gulp.watch(
        [path.resolve(LOCAL_OUTPUT_DIR, 'css/**/*.css'), `!${path.resolve(LOCAL_OUTPUT_DIR, 'css/**/*.min.css')}`],
        minifyCss
    );
    gulp.watch(
        [path.resolve(LOCAL_OUTPUT_DIR, 'js/**/*.js'), `!${path.resolve(LOCAL_OUTPUT_DIR, 'js/**/*.min.js')}`],
        minifyJs
    );
    gulp.watch([path.resolve(SRC_DIR, 'ts/**/*'), 'webpack.config.js'], compileTs);
    gulp.watch([path.resolve(SRC_DIR, 'scss/**/*.scss')], compileSass);
    gulp.watch([path.resolve(SRC_DIR, 'images/**/*')], copyImages);
}

/**
 * ----------------------------------------------
 * ------------ REMOTE ENVIRONMENT -------------
 * ----------------------------------------------
 */

/**
 * @description Gets the Rsync configuration object for copying files to the remote server
 * @param {string} root - Root directory to copy from
 * @param {string} destination - Destination directory to copy to
 * @returns {object} - Rsync configuration object
 */
async function getRsyncConfig(root, destination) {
    if (isProduction() && !env.IS_WORKFLOW) {
        throw new Error('Deployments to the production environment must be done through GitHub Actions workflows.');
    }
    const environmentName = isProduction() ? 'PRODUCTION' : 'STAGING';
    const remoteConfigName = `${environmentName}_REMOTE_CONFIG`;
    if (!ENV_CONFIG[remoteConfigName]) {
        if (env.IS_WORKFLOW) {
            throw new Error('Cannot prompt for remote server configuration in a GitHub Actions workflow');
        }
        const username = await prompt(`Please enter the username for the ${environmentName.toLowerCase()} server: `);
        const hostname = await prompt(`Please enter the hostname for the ${environmentName.toLowerCase()} server: `);
        ENV_CONFIG[remoteConfigName] = {
            HOSTNAME: hostname.replace(/(^http(s)?:\/\/|\/.*)/g, ''),
            USERNAME: username
        };
        fs.writeFileSync(DOT_ENV, JSON.stringify(ENV_CONFIG, null, 4));
    }

    const remoteConfig = ENV_CONFIG[remoteConfigName];

    const sshConfigFile = path.resolve(os.homedir(), '.ssh/config');
    const sshConfig = fs.readFileSync(sshConfigFile).toString();
    if (!sshConfig.includes(`Host ${remoteConfig.HOSTNAME}`)) {
        const sshKeyPath = `~/.ssh/website_${environmentName.toLowerCase()}_ed25519`;
        throw new Error(
            `No SSH config found for ${remoteConfig.HOSTNAME}.\n` +
                '\n' +
                `Please generate an SSH key for this environment with the following commands:\n` +
                '\n' +
                `$ ssh-keygen -t ed25519 -C "your.email.address@gmail.com" -f ${sshKeyPath} -N "" -q\n` +
                `$ eval "$(ssh-agent -s)"\n` +
                `$ ssh-add --apple-use-keychain ${sshKeyPath}\n` +
                '\n' +
                'Then copy the public key to your clipboard with the following command:\n' +
                '\n' +
                `$ pbcopy < ${sshKeyPath}.pub\n` +
                '\n' +
                'Then go to https://wordpress.com/me/security/ssh-key and add the key to your account.\n' +
                'You will also need to navigate to the wordpress site you would like to deploy to and apply your SSH key to that site.\n' +
                'This can be done under Settings > Hosting Configuration > SFTP/SSH Credentials > SSH Keys\n' +
                '\n' +
                `Finally, add the following entry to the ${sshConfigFile} file on your local computer:\n` +
                '\n' +
                `Host ${remoteConfig.HOSTNAME}\n` +
                `    UseKeychain yes\n` +
                `    AddKeysToAgent yes\n` +
                `    IdentityFile ${sshKeyPath}\n` +
                '\n' +
                'After following the steps above, please run this task again.'
        );
    }

    return {
        root,
        destination: destination + '/',
        username: remoteConfig.USERNAME,
        hostname: remoteConfig.HOSTNAME,
        incremental: true,
        recursive: true,
        relative: true,
        compress: true,
        silent: true,
        port: 22
    };
}

/**
 * @description Copies build files to remote server
 * @param {function} callback - Callback function to execute after copying files
 * @returns {Promise<void>}
 */
async function copyToRemote(callback) {
    const rsyncConfig = await getRsyncConfig(OUTPUT_DIR, path.resolve(REMOTE_OUTPUT_DIR));
    const stream = gulp
        .src(OUTPUT_DIR + '/**')
        .pipe(rsync(rsyncConfig))
        .pipe(gulp.dest(OUTPUT_DIR));
    return awaitStream(stream, callback);
}

/**
 * ----------------------------------------------
 * ------------ TASK QUEUING LOGIC --------------
 * ----------------------------------------------
 */

// Define tasks for all environments
const tasks = [clearOutputDir, copyImages, compileSass, minifyCss, compileTs, minifyJs, cleanOutputDir];

// Specify development specific tasks
if (isDevelopment()) {
    tasks.push(watch);
} else {
    tasks.push(copyToRemote);
}

// Evaluate all tasks for gulp to execute & set the default task as a series of all tasks that need to be executed for this environment
tasks.forEach((task) => gulp.task(task.name, task));
gulp.task('default', gulp.series(tasks));
