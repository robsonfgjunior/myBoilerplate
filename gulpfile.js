var autoPrefixBrowserList = ['last 2 version', 'safari 5', 'ie 8', 'ie 9', 'opera 12.1', 'ios 6', 'android 4'];

var gulp            = require('gulp'),
    sass            = require('gulp-sass'),
    browserSync     = require('browser-sync'),
    autoprefixer    = require('gulp-autoprefixer'),
    uglify          = require('gulp-uglify'),
    cssnano         = require('gulp-cssnano'),
    concat          = require('gulp-concat'),
    sourceMaps      = require('gulp-sourcemaps'),
    imagemin        = require('gulp-imagemin'),
    gulpSequence    = require('gulp-sequence').use(gulp),
    plumber         = require('gulp-plumber'),
    clean           = require('gulp-clean'),
    changed         = require('gulp-changed'),
    merge           = require('merge-stream'),
    manifest        = require('asset-builder')('./assets/manifest.json'),
    dotenv          = require('dotenv').config(),
    notify          = require("gulp-notify"),
    uncss           = require('gulp-uncss');

var path = manifest.paths,
    globs = manifest.globs,
    project = manifest.getProjectGlobs();


gulp.task('images', function () {
    gulp.src(path.source + 'images/**/*')
        .pipe(gulp.dest(path.dist + 'images'))
        .pipe(browserSync.stream());
});

gulp.task('fonts', function () {
    return gulp.src(path.source + 'fonts/**/*')
        .pipe(gulp.dest(path.dist + 'fonts'))
        .pipe(browserSync.stream());
});

gulp.task('scripts', function() {
    var merged = merge();
    manifest.forEachDependency('js', function(dep) {
        merged.add(
        gulp.src(dep.globs, {base: 'scripts'})
            .pipe(plumber({
                errorHandler: notify.onError('Error: <%= error.message %>')
            }))
            .pipe(concat(dep.name))
        );
    });
    return merged
                .pipe(gulp.dest(path.dist + 'scripts' ))
                .pipe(browserSync.stream());
});

gulp.task('styles', function() {
  var merged = merge();
  manifest.forEachDependency('css', function(dep) {
    merged.add(
        gulp.src(dep.globs, {base: 'styles'})
            .pipe(plumber({
                errorHandler: notify.onError('Error: <%= error.message %>')
            }))
            .pipe(sourceMaps.init())
            .pipe(sass({
                    errLogToConsole: true,
                    includePaths: ['.']
                })
            )
            .pipe(autoprefixer({
                browsers: autoPrefixBrowserList,
                cascade:  true
            }))
            .pipe(sourceMaps.write())
            .pipe(concat(dep.name))
    
    );
  });
  return merged
            .pipe(gulp.dest(path.dist + 'styles' ))
            .pipe(browserSync.stream());
});

gulp.task('wiredep', function() {
  var wiredep = require('wiredep').stream;
  return gulp.src(project.css)
    .pipe(wiredep())
    .pipe(changed(path.source + 'styles', {
      hasChanged: changed.compareSha1Digest
    }))
    .pipe(gulp.dest(path.source + 'styles'));
});

gulp.task('default', gulpSequence('clean', 'images', 'fonts', 'scripts', 'wiredep', 'styles') );

gulp.task('clean', function () {
	return gulp.src(path.dist, {read: false} )
		.pipe(clean());
});

gulp.task('watch', ['default'], function() {
    browserSync.init({
        files: ['public/**/*.html'],
        proxy: process.env.DEV_URL,
        notify: false
    });

    gulp.watch(path.source + 'images/**/*', ['images']);
    gulp.watch(path.source + 'fonts/**/*', ['fonts']);
    gulp.watch(path.source + 'scripts/**/*', ['scripts']);
    gulp.watch(path.source + 'styles/**/*', ['styles']);
});

gulp.task('build', ['default'], function() {

    gulp.src(path.dist + 'images/**/*' )
        .pipe(imagemin({
            optimizationLevel: 5,
            progressive: true,
            interlaced: true
        }))
        .pipe(gulp.dest(path.dist + 'images' ));

    gulp.src(path.dist + 'scripts/**/*.js' )
        .pipe(uglify())
        .pipe(gulp.dest( path.dist + 'scripts' ));

    gulp.src(path.dist + 'styles/**/*.css' )
        .pipe(cssnano())
        .pipe(gulp.dest(path.dist + 'styles' ));
});
