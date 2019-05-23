// Load plugins
const browsersync = require("browser-sync").create();
const gulp = require("gulp");
var nunjucksRender = require("gulp-nunjucks-render");
var data = require("gulp-data");
var path = require("path");
var fs = require("fs");
var netlify = require("gulp-netlify");
var merge = require("gulp-merge-json");

const imagemin = require("gulp-imagemin");

var manageEnvironment = function(env) {
  env.addFilter("split", function(str, seperator) {
    return str.split(seperator);
  });
};

const groupJson = {};
groupJson.articles = [];

gulp.task("combine_json", function(cb) {
  gulp
    .src("./posts/*.json")
    .pipe(
      merge({
        fileName: "articles.json",
        // startObj: [],
        // concatArrays: true,
        // mergeArrays: false,
        // jsonSpace: "  ",
        // jsonReplacer: (key, value) => {
        //   const groupJson = {};

        //   groupJson.articles = [];
        //   // groupJson.articles = value;

        //   console.log(key, value);
        //   return groupJson;
        // }
        // exportModule: "const myVar"
        edit: (parsedJson, file) => {
          // console.log(parsedJson, file);

          groupJson.articles.push(parsedJson);

          return groupJson;
        }
      })
    )
    .pipe(gulp.dest("./assets/data"));
  cb();
});

gulp.task("render_content", function(cb) {
  // Copy assets to dist folder
  gulp.src(["./assets/**/*"]).pipe(gulp.dest("./dist/assets/"));
  gulp.src(["pages/**/*.yml"]).pipe(gulp.dest("./dist/"));

  //Render images
  // gulp
  //   .src("./assets/images/**/*")
  //   .pipe(imagemin())
  //   .pipe(gulp.dest("dist/assets/images"));

  //Render nunjucks to html
  gulp
    .src("pages/**/*.+(html|njk)")
    // Adding data to Nunjucks
    // .pipe(
    //   data(function() {
    //     return require("data.json");
    //   })
    // )
    .pipe(
      data(function(file) {
        return JSON.parse(fs.readFileSync("./assets/data/articles.json"));
      })
    )
    .pipe(
      nunjucksRender({
        path: ["templates/"], // String or Array
        data: {
          site_title: "Nunjucks Test"
        },
        envOptions: {
          watch: false
        },
        manageEnv: manageEnvironment
      })
    )
    .pipe(gulp.dest("dist"));
  cb();
});

gulp.task("render_images", function(cb) {
  gulp
    .src("./assets/images/**/*")
    .pipe(imagemin())
    .pipe(gulp.dest("dist/assets/images"));
  cb();
});

// gulp.task("deploy", function() {
//   gulp.src("./dist/**/*").pipe(
//     netlify({
//       site_id: "imoro-demosite",
//       access_token:
//         "5f4eca17ba6f9727e4e859df2dc6d8cd43745b7c15d5312e4d814d10db1bf6b1"
//     })
//   );
// });

// BrowserSync
function browserSync(done) {
  browsersync.init({
    server: {
      baseDir: "./dist"
    }
  });
  done();
}

// BrowserSync Reload
function browserSyncReload(done) {
  // gulp.parallel("vendor");
  browsersync.reload();
  done();
}

// Watch files
function watchFiles() {
  gulp.watch("./assets/**/*", gulp.series("render_content"));
  gulp.watch("./templates/**/*", gulp.series("render_content"));
  gulp.watch("./pages/**/*", gulp.series("render_content"));
  gulp.watch("./dist/*.html", browserSyncReload);
}

gulp.task(
  "default",
  gulp.parallel("combine_json", "render_content", "render_images")
);

// dev task
gulp.task(
  "dev",
  gulp.parallel("combine_json", "render_content", watchFiles, browserSync)
);
