const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const uglify = require('gulp-uglify');
const autoprefixer = require('gulp-autoprefixer');
const rename = require('gulp-rename');
const tap = require('gulp-tap');
const buffer = require('gulp-buffer');
const image = require('gulp-image');
const browserSync = require('browser-sync').create();
const browserify = require('browserify');
const notifier = require('node-notifier');

// Main config for paths and browserSync settings
const config = {};

// Source and distribition folders
config.paths = {
    src: {
        scss: 'src/scss',
        js: 'src/js',
    },
    dist: {
        css: 'assets/css',
        js: 'assets/js',
        img: 'assets/img'
    }
}


/*/ ============================================================================
    BROWSERSYNC SETTINGS
    Uncomment "proxy" and comment out "server" if you're using a local server
============================================================================ /*/

config.browserSync = {
    // proxy: 'localhost:8000'
    server: { baseDir: "./" },
    files: [
        config.paths.dist.css,
        config.paths.dist.js,
        '**/*.html'
    ]
};

config.sass = {
    outputStyle: "expanded",
    includePaths: [
        "./node_modules/bootstrap/scss",
        "./node_modules"
    ],
}

/*/ ============================================================================
    GULP TASKS
============================================================================ /*/

function alert() {
    function sendMessage(title, message, sound) {
        notifier.notify({
            title,
            message: message,
            sound: sound
        });
    };

    return {
        success: (title, message) => {
            sendMessage(title, message)
        },
        error: (title, err) => {
            sendMessage(title, message, 'Basso')
        }
    };
}

var alert = alert();

const compileSCSS = () => {
    return gulp.src(`${config.paths.src.scss}/styles.scss`)
        .pipe(sass(config.sass).on('error', err => alert.error('SCSS Compile Error', err.message)))
        .pipe(autoprefixer())
        .pipe(cleanCSS({compatibility: '*'}))
        .pipe(rename({suffix: '.min'}))
        .pipe(gulp.dest(config.paths.dist.css))
        .pipe(rename(path => {
            alert.success("SCSS Compiled", path.basename + path.extname)
        }))
}

const compileJS = () => {
    return gulp.src(`${config.paths.src.js}/*.js`, { read: false })
        .pipe(tap(file => {
            file.contents = browserify(file.path, { debug: true })
                .transform('babelify', { presets: ['@babel/preset-env'] })
                .bundle();
        }))
        .pipe(buffer())
        .pipe(uglify().on('error', err => alert.error('JS Compile Error', err.message)))
        .pipe(rename({ suffix: '.min' }))
        .pipe(gulp.dest(config.paths.dist.js));
}

const optimizeImages = () => {
    return gulp.src(`${config.paths.dist.img}/**/*`)
        .pipe(image())
        .pipe(gulp.dest(config.paths.dist.img));
}

const liveReload = () => {
    browserSync.init(config.browserSync)
}

// Watch files for changes
const watchForChanges = () => {
    gulp.watch(`${config.paths.src.js}/**/*.js`, compileJS)
    gulp.watch(`${config.paths.src.scss}/**/*.scss`, compileSCSS)
};

// Compile sources + watch for changes
// 2 versions with/without live reload
const compileWatch = gulp.series(compileSCSS, compileJS, watchForChanges);
const compileWatchReload = gulp.series(compileSCSS, compileJS, gulp.parallel(watchForChanges, liveReload));

// Build project for production (compile JS ans SCSS + optimize images)
const build = gulp.series(compileSCSS, compileJS, optimizeImages);

// Gulp tasks you can use in terminal by typing gulp + task name
// For example: gulp optimizeImages
exports.compileSCSS = compileSCSS;
exports.compileJS = compileJS;
exports.optimizeImages = optimizeImages;
exports.liveReload = liveReload;

exports.compileWatch = exports.devNoReload = compileWatch;
exports.compileWatchReload = exports.dev = compileWatchReload;
exports.build = build;
