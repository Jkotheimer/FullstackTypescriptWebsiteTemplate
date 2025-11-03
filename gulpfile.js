/**
 * @description Gulpfile for compiling SCSS to minified CSS, compiling TS to minified JS, and copying images and dependencies to the build/ directory
 */
import CLIReader, { CLIValueConfig } from './bin/utils/cli-reader.ts';
import ensureNodeEnv from './bin/utils/node-env.ts';

import beautifyCode from 'gulp-beautify-code';
import autoprefixer from 'gulp-autoprefixer';
import environments from 'gulp-environments';
import sourcemaps from 'gulp-sourcemaps';
import typescript from 'gulp-typescript';
import webpack from 'webpack-stream';
import cssnano from 'gulp-cssnano';
import replace from 'gulp-replace';
import gulpSass from 'gulp-sass';
import uglify from 'gulp-uglify';
import rename from 'gulp-rename';
import clean from 'gulp-clean';
import * as sass from 'sass';
import crypto from 'crypto';
import gulp from 'gulp';
import path from 'path';
import url from 'url';
import fs from 'fs';

// Converted from CommonJS to ESM
const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * @typedef {Object} GulpArgs
 * @property {('client'|'server'|'all')} STACK
 * @property {boolean} WATCH
 */

/**
 * @type {GulpArgs}
 */
const ARGS = CLIReader.parseArgv([
    new CLIValueConfig({
        key: 'STACK',
        label: 'Stack',
        type: 'enum',
        flags: new Set(['--stack', '-s']),
        enumValues: new Set(['client', 'server', 'all']),
        defaultValue: 'all'
    }),
    new CLIValueConfig({
        key: 'WATCH',
        label: 'Watch',
        type: 'boolean',
        flags: new Set(['--watch', '-w'])
    })
]);
console.log('ARGS:', ARGS);

ensureNodeEnv('development').then(() => {
    console.log('Env configured:', process.env.NODE_ENV);
});
// Set environment variables
console.log('Current before:', environments.current());
if (!environments[process.env.NODE_ENV]) {
    console.warn('WARNING: Environment does not exist:', process.env.NODE_ENV);
    console.warn('Creating environment:', process.env.NODE_ENV);
    environments.make(process.env.NODE_ENV);
}
environments.current(environments[process.env.NODE_ENV]);
console.log('Current after:', environments.current());

// Environment vars
const DOT_ENV_NAME = `.env.${process.env.NODE_ENV}`;
const DOT_ENV = path.resolve(__dirname, DOT_ENV_NAME);
console.log(DOT_ENV);

// Define source directories
const SRC_DIR = path.resolve(__dirname, 'src');
const SRC_DIR_CLIENT = path.resolve(SRC_DIR, 'client');
const SRC_DIR_SERVER = path.resolve(SRC_DIR, 'server');

// Define output directories
const OUT_DIR = path.resolve(__dirname, 'dist');
const OUT_DIR_CLIENT = path.resolve(OUT_DIR, 'public');
const OUT_DIR_SERVER = OUT_DIR;

if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR);
}

// Typescript project configuration
const TS_PROJECT_CLIENT = typescript.createProject('tsconfig.json');
const TS_PROJECT_SERVER = typescript.createProject('tsconfig.json');

TS_PROJECT_CLIENT.config.exclude.push('./src/server/**/*');
TS_PROJECT_CLIENT.config.compilerOptions.target = 'ES5';
TS_PROJECT_CLIENT.config.compilerOptions.lib = ['ES5', 'ES6', 'DOM'];
TS_PROJECT_CLIENT.config.compilerOptions.moduleResolution = 'bundler';

TS_PROJECT_SERVER.config.exclude.push('./src/client/**/*');
TS_PROJECT_CLIENT.config.compilerOptions.target = 'ES2020';
TS_PROJECT_CLIENT.config.compilerOptions.lib = ['ES2020'];
TS_PROJECT_CLIENT.config.compilerOptions.moduleResolution = 'node';

// Configuration for beautifying code
const BEAUTIFY_CONFIG = Object.freeze({
    indent_size: 4,
    indent_char: ' '
});

// Used to refresh dynamic imports. e.g. import(`./script.js?${++cacheBuster}`)
let cacheBuster = 0;

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
    return gulp.src(OUT_DIR, { read: false }).pipe(clean());
}

/**
 * ----------------------------------------------
 * -------------- STACK COMPILERS ---------------
 * ----------------------------------------------
 */

class Client {
    static get tasks() {
        const tasks = [
            Client.copyImages,
            Client.copyTemplates,
            Client.compileSass,
            Client.minifyCss,
            Client.compileTs,
            Client.minifyJs,
            Client.cleanArtifacts
        ];
        if (environments.production()) {
            tasks.push(Client.cleanNonMinifiedCode);
        }
        if (ARGS.WATCH) {
            tasks.push(Client.watch);
        }
        return tasks;
    }

    /**
     * @description Copies all images from the source directory to the output directory
     * @returns {NodeJS.ReadWriteStream}
     */
    static copyImages() {
        return gulp
            .src([path.resolve(SRC_DIR_CLIENT, 'images/*'), `!${path.resolve(SRC_DIR_CLIENT, 'images/*.d.ts')}`])
            .pipe(gulp.dest(path.resolve(OUT_DIR_CLIENT, 'images')));
    }

    /**
     * @description Copies all images from the source directory to the output directory
     * @returns {NodeJS.ReadWriteStream}
     */
    static copyTemplates() {
        return gulp
            .src([path.resolve(SRC_DIR_CLIENT, 'templates/*'), `!${path.resolve(SRC_DIR_CLIENT, 'templates/*.d.ts')}`])
            .pipe(gulp.dest(OUT_DIR_CLIENT));
    }

    /**
     * @description Compiles all SCSS files to CSS
     * @returns {NodeJS.ReadWriteStream}
     */
    static compileSass() {
        return gulp
            .src(path.resolve(SRC_DIR_CLIENT, 'scss/*.scss'))
            .pipe(gulpSass(sass)())
            .pipe(
                autoprefixer({
                    cascade: false,
                    remove: false
                })
            )
            .pipe(beautifyCode(BEAUTIFY_CONFIG))
            .pipe(gulp.dest(path.resolve(OUT_DIR_CLIENT, 'css')));
    }

    /**
     * @description Compiles all TS files to JS and bundles react dependencies using webpack
     * @see tsconfig.json for TypeScript configuration
     * @see webpack.config.js for Webpack configuration
     * @param {function} callback - Callback function to execute after compilation
     * @returns {Promise<void>}
     */
    static async compileTs(callback) {
        const webpackConfig = await import(`./webpack.config.js?${cacheBuster++}`);
        const stream = TS_PROJECT_CLIENT.src()
            .pipe(TS_PROJECT_CLIENT())
            .js.pipe(webpack(webpackConfig.default))
            .pipe(beautifyCode(BEAUTIFY_CONFIG))
            .pipe(gulp.dest(path.resolve(OUT_DIR_CLIENT, 'js')));
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
    static minifyCss() {
        return gulp
            .src([path.resolve(OUT_DIR_CLIENT, 'css/*.css'), `!${path.resolve(OUT_DIR_CLIENT, 'css/*.min.css')}`])
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
            .pipe(gulp.dest(path.resolve(OUT_DIR_CLIENT, 'css')));
    }

    /**
     * @description Minifies all JS files
     * @returns {NodeJS.ReadWriteStream}
     */
    static minifyJs() {
        return gulp
            .src([
                path.resolve(OUT_DIR_CLIENT, 'js/**/*.js'),
                `!${path.resolve(OUT_DIR_CLIENT, 'js/**/*.min.js')}`,
                `!${path.resolve(OUT_DIR_CLIENT, 'js/lib/*.js')}`
            ])
            .pipe(environments.development(sourcemaps.init()))
            .pipe(environments.production(uglify()))
            .pipe(
                rename({
                    suffix: '.min'
                })
            )
            .pipe(environments.development(sourcemaps.write('maps')))
            .pipe(gulp.dest(path.resolve(OUT_DIR_CLIENT, 'js')));
    }

    /**
     * @description Cleans the output directory of all files except minified files
     * @returns {NodeJS.ReadWriteStream}
     */
    static cleanNonMinifiedCode() {
        return gulp
            .src([
                path.resolve(OUT_DIR_CLIENT, './**/*.js'),
                path.resolve(OUT_DIR_CLIENT, './**/*.css'),
                `!${path.resolve(OUT_DIR_CLIENT, './**/*.min.js')}`,
                `!${path.resolve(OUT_DIR_CLIENT, './**/*.min.css')}`
            ])
            .pipe(clean());
    }

    static cleanArtifacts() {
        return gulp.src(path.resolve(OUT_DIR_CLIENT, 'js/src')).pipe(clean());
    }

    /**
     * ----------------------------------------------
     * ------- LOCAL DEVELOPMENT ENVIRONMENT --------
     * ----------------------------------------------
     */

    /**
     * @description Watches for changes in the source directory and runs the appropriate task
     */
    static watch() {
        gulp.watch(
            [path.resolve(OUT_DIR_CLIENT, 'css/**/*.css'), `!${path.resolve(OUT_DIR_CLIENT, 'css/**/*.min.css')}`],
            Client.minifyCss
        );
        gulp.watch(
            [path.resolve(OUT_DIR_CLIENT, 'js/**/*.js'), `!${path.resolve(OUT_DIR_CLIENT, 'js/**/*.min.js')}`],
            Client.minifyJs
        );
        gulp.watch([path.resolve(SRC_DIR, 'ts/**/*'), 'webpack.config.js'], Client.compileTs);
        gulp.watch([path.resolve(SRC_DIR, 'scss/**/*.scss')], Client.compileSass);
        gulp.watch([path.resolve(SRC_DIR, 'images/**/*')], Client.copyImages);
        gulp.watch([path.resolve(SRC_DIR, 'templates/**/*')], Client.copyTemplates);
    }
}

class Server {
    static get tasks() {
        const tasks = [Server.compile, Server.portEnvironmentVariables, Server.resolveServerImports];
        if (ARGS.WATCH) {
            tasks.push(Server.watch);
        }
        return tasks;
    }

    // Task to compile TypeScript
    static compile() {
        return TS_PROJECT_SERVER.src().pipe(TS_PROJECT_SERVER()).js.pipe(gulp.dest(OUT_DIR_SERVER));
    }

    // Task to ensure .env file exists for current environment, and copy .env file over to destination folder
    static portEnvironmentVariables() {
        if (!fs.existsSync(DOT_ENV)) {
            throw new Error(`${DOT_ENV_NAME} file not found. Please run "npm run configure"`);
        }
        return gulp.src(DOT_ENV).pipe(rename('.env')).pipe(gulp.dest(OUT_DIR_SERVER));
    }

    // Task to change all import aliases to relative paths
    static resolveServerImports() {
        const pathAliases = Object.keys(TS_PROJECT_SERVER.options.paths);

        // Regex "if" block. e.g. api|database|utils|models
        const pathAliasesRegexSearch = pathAliases.map((p) => p.replace(/^@(.*?)(\/\*)?$/g, '$1')).join('|');

        // $1: Import variable name (keep)
        // $2: Path alias (replace)
        // $3: Relative path (keep)
        const variableImportRegex = new RegExp(`import (.*?) from '@(${pathAliasesRegexSearch})(.*?)?'`, 'g');
        const staticImportRegex = new RegExp(`import '@(${pathAliasesRegexSearch})(.*?)?'`, 'g');

        /**
         * @description Modify the file path to have a .js file ending. Replaces .ts with .js, else appends .js
         * @param {string} filePath
         * @returns {string} File path with .js file ending
         */
        const addDotJS = (filePath) => {
            if (!filePath?.length) {
                return '';
            }
            filePath = filePath.replace(/\.ts$/g, '.js');
            if (!filePath.endsWith('.js')) {
                filePath += '.js';
            }
            return filePath;
        };

        /**
         * @description Convert a path alias to a relative local path based on the path of the file where the alias originates from
         * @param {string} rawAlias
         * @param {string} filePath
         * @returns {string} Relative local path
         */
        const getLocalPath = (rawAlias, filePath) => {
            // Raw alias should always be unique (i.e. "api", "database", "constants", "utils", etc.)
            const pathAlias = pathAliases.find((alias) => alias.includes(rawAlias));
            if (!pathAlias) {
                return '';
            }
            // Assume each alias only maps to one local path. Remove tailing slash and/or wildcard from this path
            const localPath = TS_PROJECT_SERVER.options.paths[pathAlias]?.[0]
                ?.replace(/(\/\*|\/|\*)$/g, '')
                ?.replace(/^\.\//, '');
            if (!localPath) {
                return '';
            }
            const modulePathPrefix = path
                .dirname(filePath)
                .replace(OUT_DIR_SERVER, '')
                .split('/')
                .map((x, i) => (i === 0 ? './' : '../'))
                .join('');
            return modulePathPrefix + localPath;
        };

        /**
         * @description Replace the path alias in an import statement with the full relative path
         * @param {string | null} variableName
         * @param {string} rawAlias
         * @param {string} moduleProjectPath
         * @param {string} fileAbsolutePath
         * @returns {string} Import call with relative path
         */
        const handleReplace = (variableName, rawAlias, moduleProjectPath, fileAbsolutePath) => {
            moduleProjectPath = addDotJS(moduleProjectPath);
            let localPath = getLocalPath(rawAlias, fileAbsolutePath);
            if (!localPath) {
                // Original value with "@" stripped
                return variableName
                    ? `import ${variableName} from '${rawAlias}${moduleProjectPath}'`
                    : `import '${rawAlias}${moduleProjectPath}'`;
            }
            if (!moduleProjectPath) {
                // localPath must contain js file. Add .js file ending
                localPath = addDotJS(localPath);
            }
            const result = variableName
                ? `import ${variableName} from '${localPath}${moduleProjectPath}'`
                : `import '${localPath}${moduleProjectPath}'`;
            return result;
        };

        // Replace all imports across all js files in the out dir
        return gulp
            .src([path.resolve(OUT_DIR_SERVER, './**/*.js'), `!${OUT_DIR_CLIENT}`])
            .pipe(
                replace(variableImportRegex, function (match, variableName, rawAlias, moduleProjectPath = '') {
                    return handleReplace(variableName, rawAlias, moduleProjectPath, this.file.path);
                })
            )
            .pipe(
                replace(staticImportRegex, function (match, rawAlias, moduleProjectPath = '') {
                    return handleReplace(null, rawAlias, moduleProjectPath, this.file.path);
                })
            )
            .pipe(gulp.dest(OUT_DIR_SERVER));
    }

    /**
     * ----------------------------------------------
     * ------- LOCAL DEVELOPMENT ENVIRONMENT --------
     * ----------------------------------------------
     */

    /**
     * @description Watches for changes in the source directory and runs the appropriate task
     */
    static watch() {
        gulp.watch(
            [SRC_DIR_SERVER, path.resolve(SRC_DIR_SERVER, 'constants'), path.resolve(SRC_DIR_SERVER, 'models')],
            Server.compile
        );
    }
}

/**
 * ----------------------------------------------
 * ------------ TASK QUEUING LOGIC --------------
 * ----------------------------------------------
 */

// Define tasks for all environments
const tasks = [clearOutputDir];

if (ARGS.STACK === 'server' || ARGS.STACK === 'all') {
    tasks.push(...Server.tasks);
}
if (ARGS.STACK === 'client' || ARGS.STACK === 'all') {
    tasks.push(...Client.tasks);
}

// Evaluate all tasks for gulp to execute & set the default task as a series of all tasks that need to be executed for this environment
tasks.forEach(gulp.task);
gulp.task('default', gulp.series(tasks));
