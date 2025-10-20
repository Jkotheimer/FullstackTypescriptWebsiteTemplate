import { fileURLToPath } from 'url';
import { dirname } from 'path';
import configure from './bin/configure.js';
import environments from 'gulp-environments';
import replace from 'gulp-replace';
import rename from 'gulp-rename';
import ts from 'gulp-typescript';
import clean from 'gulp-clean';
import gulp from 'gulp';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const OUT_DIR = __dirname + '/dist';

if (!fs.existsSync(OUT_DIR)) {
	fs.mkdirSync(OUT_DIR);
}

const environment = environments.development ? 'dev' : 'production';

// TypeScript project configuration
const tsProject = ts.createProject('tsconfig.json');

gulp.task('clean', () => {
    return gulp.src(OUT_DIR, { read: false }).pipe(clean({ force: true }));
});

// Task to compile TypeScript
gulp.task('compile', () => {
    return tsProject.src().pipe(tsProject()).js.pipe(gulp.dest('dist'));
});

// Task to ensure .env file exists for current environment, and copy .env file over to destination folder
gulp.task('port-environment-variables', async () => {
    const dotenvFileName = `.env.${environment}`;
    const dotenvFilePath = path.resolve(__dirname, dotenvFileName);

    // If the dotenv file does not exist, run the configure script to prompt the user for environment vars
    if (!fs.existsSync(dotenvFilePath)) {
        await configure({ environment });
    }

    gulp.src(dotenvFilePath).pipe(rename('.env')).pipe(gulp.dest(OUT_DIR));
});

// Task to change all import aliases to relative paths
gulp.task('fix-imports', () => {
    const pathAliases = Object.keys(tsProject.options.paths);

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
        const localPath = tsProject.options.paths[pathAlias]?.[0]?.replace(/(\/\*|\/|\*)$/g, '')?.replace(/^\.\//, '');
        if (!localPath) {
            return '';
        }
        const modulePathPrefix = dirname(filePath)
            .replace(OUT_DIR, '')
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
            return variableName ? `import ${variableName} from '${rawAlias}${moduleProjectPath}'` : `import '${rawAlias}${moduleProjectPath}'`;
        }
        if (!moduleProjectPath) {
            // localPath must contain js file. Add .js file ending
            localPath = addDotJS(localPath);
        }
        const result = variableName ? `import ${variableName} from '${localPath}${moduleProjectPath}'` : `import '${localPath}${moduleProjectPath}'`;
        return result;
    };

    // Replace all imports across all js files in the out dir
    return gulp
        .src(OUT_DIR + '/**/*.js')
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
        .pipe(gulp.dest(OUT_DIR));
});

// Default task: compile TypeScript and fix imports
gulp.task('default', gulp.series('clean', 'compile', 'port-environment-variables', 'fix-imports'));
