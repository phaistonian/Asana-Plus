// https://github.com/gulpjs/gulp/blob/master/docs/recipes/running-tasks-in-series.md
const gulp = require('gulp');
const bump = require('gulp-bump');
const zip = require('gulp-zip');
const fs = require('fs');
const path = require('path');
const rimraf = require('gulp-rimraf');
const svgstore = require('gulp-svgstore');
const rename = require('gulp-rename');
const cheerio = require('gulp-cheerio');

const getPackageJson = function () {
  return JSON.parse(fs.readFileSync('./manifest.json', 'utf8'));
};

const extensionName = 'Asana Plus';

gulp.task('bump', () => gulp.src('./manifest.json')
    .pipe(bump({ type: 'minor' }))
    .pipe(gulp.dest('./')));

gulp.task('remove', cb => {
  gulp.src(`./${extensionName}*.zip`, { read: false })
    .pipe(rimraf());

  cb();
});

gulp.task('zip', cb => {
  gulp.src([
    './icons/**',
    './assets/**',
    './dist/**',
    './manifest.json',
  ], { base: '.' })
    .pipe(zip(`${extensionName} ${getPackageJson().version.replace(/\./gi, '-')}.zip`))
    .pipe(gulp.dest('./'));
  cb();
});

gulp.task('default',
  gulp.series('bump', 'remove', 'zip')
);
