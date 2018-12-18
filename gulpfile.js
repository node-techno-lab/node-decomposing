var gulp = require('gulp'),
  del = require('del'),
  runSeq = require('run-sequence');

gulp.task('clean:dist', function () {
  return del('dist/**/*', { force: true });
});

gulp.task('del:js:map', function () {
  return del([
    "src/**/*.js",
    "src/**/*.map"
  ], { force: true })
});

gulp.task('copy:js:map', function () {
  return gulp.src([
    "src/**/*.js",
    "src/**/*.map"
  ])
    .pipe(gulp.dest('./dist'))
});

gulp.task('copy:config', function () {
  return gulp.src([
    "src/config/**/*"
  ])
    .pipe(gulp.dest('./dist/config'))
});

gulp.task('copy:json', function () {
  return gulp.src([
    "src/**/*.json", "src/../package.json"
  ])
    .pipe(gulp.dest('./dist'))
});

gulp.task('copy', function (done) {
  return runSeq(['copy:js:map', 'copy:json', 'copy:config'], done);
});
