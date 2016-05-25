var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var del = require('del');
var es = require('event-stream');
var print = require('gulp-print');
var less = require('gulp-less');
var Q = require('q');
var connect = require('gulp-connect');
var open = require('open');
var mainBowerFiles = require('main-bower-files');

// == PATH STRINGS ========

var paths = {
    scripts: 'src/**/*.js',
    appStyles: 'src/**/*.css',
    //vendorStyles: '../bower_components/**/**/**/*.css',
    less: 'src/less',
    images: 'src/images/**/*',
    fonts: ['src/fonts/**/*', 'bower_components/font-awesome/fonts/*'],
    index: 'src/index.html',
    partials: ['src/component/**/**/*.html', '!src/index.html'],
    dev: 'dev',
    dist: 'dist',
    distScriptsProd: 'dist/scripts',
    vendorLibs: 'bower_components'
    //scriptsDevServer: 'devServer/**/*.js'
};

// == PIPE SEGMENTS ========

var pipes = {};

pipes.orderedVendorScripts = function() {
    return plugins.order(['jquery.js', 'angular.js', 'leaflet-src.js', 'esri-leaflet.js', 'angular-leaflet-directive.js', 'directives.module.js', 'service.module.js', 'RequestInfo.js', 'HTTPServiceBase.js', 'Delegate.js', 'RequestTransform.js', 'EventManager.js','EventArgs.js', 'wimLegend.js']);
};

// pipes.orderedVendorScripts = function() {
//     return plugins.order(['jquery/dist/jquery.js', 'angular/angular.js', 'leaflet/dist/leaflet-src.js', 'esri-leaflet/dist/esri-leaflet.js', 'angular-leaflet-directive/dist/angular-leaflet-directive.js']);
// };

//pipes.orderedAppStyles = function(){
//    return plugins.order(['select.css, app.css']);
//};

//pipes.orderedVendorStyles = function(){
//    return plugins.order(['first.css, second.css']);
//};

//this angularFilesort plugin may not work because each file does not have a uniquely named module(needed, acc. to docs)
pipes.orderedAppScripts = function() {
    return plugins.angularFilesort();
};

pipes.minifiedFileName = function() {
    return plugins.rename(function (path) {
        path.extname = '.min' + path.extname;
    });
};

pipes.validatedAppScripts = function() {
    return gulp.src(paths.scripts)
        .pipe(plugins.jshint())
        .pipe(plugins.jshint.reporter('jshint-stylish'));
};

pipes.builtAppScriptsDev = function() {
    return pipes.validatedAppScripts()
        .pipe(gulp.dest(paths.dev));
};

///comments in function are artifacts of old partial scripting using the ng-html2js plugin, now stripped out
pipes.builtAppScriptsProd = function() {
    //var scriptedPartials = pipes.scriptedPartials();
    //var validatedAppScripts = pipes.validatedAppScripts();
    //return es.merge(scriptedPartials, validatedAppScripts)
    return pipes.validatedAppScripts()
        .pipe(pipes.orderedAppScripts())
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.concat('app.min.js'))
        .pipe(plugins.uglify({mangle: false}))
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest(paths.distScriptsProd));
};

//this actually takes everything listed in the "main" object in the package's bower.json file. not just scripts.
// pipes.builtVendorScriptsDev = function() {
//     //return gulp.src(paths.vendorLibs + '/**/**/*')
//          return mainBowerFiles().pipe(gulp.dest('dev/bower_components'));
// };
//this does not use the main-bower-files plugin - too messy in real world dev
// pipes.builtVendorScriptsDev = function() {
//     return gulp.src(paths.vendorLibs + '/**/**/*')
//         .pipe(gulp.dest('dev/bower_components'));
// };

pipes.builtVendorScriptsDev = function() {
    return gulp.src(mainBowerFiles())
        .pipe(gulp.dest('dev/bower_components'));
};

pipes.builtVendorImagesDev = function() {
    //in parens below is filter statement for bowerFiles retrieval
    return gulp.src(mainBowerFiles(['images/**', '**/images/**']))
        .pipe(gulp.dest('dev/bower_components/images'));
};

pipes.builtVendorImagesProd = function() {
    //in parens below is filter statement for bowerFiles retrieval
    return gulp.src(mainBowerFiles(['images/**', '**/images/**']))
        .pipe(gulp.dest(paths.dist + '/images/'));
};


pipes.builtVendorScriptsProd = function() {
    return gulp.src(mainBowerFiles('**/*.js'))
        .pipe(pipes.orderedVendorScripts())
        //added
        .pipe(plugins.sourcemaps.init())
        .pipe(plugins.concat('vendor.min.js'))
        .pipe(plugins.uglify({mangle: false}))
        //added
        .pipe(plugins.sourcemaps.write())
        .pipe(gulp.dest(paths.distScriptsProd));
};
//checked 5/5 BAD

pipes.validatedPartials = function() {
    return gulp.src(paths.partials)
        .pipe(plugins.htmlhint({'doctype-first': false}))
        .pipe(plugins.htmlhint.reporter());
};

pipes.builtPartialsDev = function() {
    return pipes.validatedPartials()
        .pipe(gulp.dest(paths.dev + '/component'));
};

///adding as new task, to abandon the conversion to scripts
pipes.builtPartialsProd = function() {
    return pipes.validatedPartials()
        .pipe(gulp.dest(paths.dist + '/component'));
};
///////////////////////////////////////////////

///stripped this out for needless complication. may revisit.
//pipes.scriptedPartials = function() {
//    return pipes.validatedPartials()
//        .pipe(plugins.htmlhint.failReporter())
//        .pipe(plugins.htmlmin({collapseWhitespace: true, removeComments: true}))
//        .pipe(plugins.ngHtml2js({
//            moduleName: "app",
//            declareModule: false
//        }));
//};

///stripped out sass compiler - sass not in use
pipes.builtAppStylesDev = function() {
    return gulp.src(paths.appStyles)
        //.pipe(plugins.sass())
        .pipe(gulp.dest(paths.dev));
};

//pipes.builtVendorStylesDev = function (){
//        return gulp.src(bowerFiles())
//        //return gulp.src(paths.vendorStyles)
//            .pipe(gulp.dest('dev/bower_components'));
//
//};


///updated css minification to use cssnano
pipes.builtAppStylesProd = function() {
    return gulp.src(paths.appStyles)
        .pipe(plugins.sourcemaps.init())
        //     .pipe(plugins.sass())
        //     .pipe(plugins.minifyCss())
        //.pipe(plugins.minifyCss())
        .pipe(plugins.cssnano())
        .pipe(plugins.sourcemaps.write())
        .pipe(pipes.minifiedFileName())
        .pipe(gulp.dest(paths.dist));
};
///////////////////////////////////////////////

pipes.builtVendorStylesProd = function() {
    return gulp.src(mainBowerFiles('**/*.css'))
        //.pipe(pipes.orderedVendorStyles())
        .pipe(plugins.concat('vendor.min.css'))
        .pipe(gulp.dest(paths.dist + '/css'));
};
////////////////////////////////////////////////////////

pipes.processedImagesDev = function() {
    return gulp.src(paths.images)
        .pipe(gulp.dest(paths.dev + '/images/'));
};

pipes.processedImagesProd = function() {
    return gulp.src(paths.images)
        .pipe(gulp.dest(paths.dist + '/images/'));
};

pipes.processedIconsDev = function() {
    return gulp.src(paths.fonts)
        .pipe(gulp.dest(paths.dev + '/fonts'))
}

pipes.processedIconsProd = function() {
    return gulp.src(paths.fonts)
        .pipe(gulp.dest(paths.dist + '/fonts'))
}

pipes.validatedIndex = function() {
    return gulp.src(paths.index)
        .pipe(plugins.htmlhint())
        .pipe(plugins.htmlhint.reporter());
};

pipes.builtIndexDev = function() {

    var orderedVendorScripts = pipes.builtVendorScriptsDev()
        .pipe(pipes.orderedVendorScripts());

    var orderedAppScripts = pipes.builtAppScriptsDev()
        .pipe(pipes.orderedAppScripts());
    //var orderedAppStyles = pipes.orderedAppStyles();
    var appStyles = pipes.builtAppStylesDev();

    return pipes.validatedIndex()
        .pipe(gulp.dest(paths.dev)) // write first to get relative path for inject
        .pipe(plugins.inject(orderedVendorScripts, {relative: true, name: 'bower'}))
        .pipe(plugins.inject(orderedAppScripts, {relative: true}))
        //.pipe(plugins.inject(orderedAppStyles, {relative:true}))
        .pipe(plugins.inject(appStyles, {relative: true}))
        .pipe(gulp.dest(paths.dev));
};


pipes.builtIndexProd = function() {

    var vendorScripts = pipes.builtVendorScriptsProd();
    var appScripts = pipes.builtAppScriptsProd();
    var appStyles = pipes.builtAppStylesProd();
    var vendorStyles = pipes.builtVendorStylesProd();

    return pipes.validatedIndex()
        .pipe(gulp.dest(paths.dist)) // write first to get relative path for inject
        .pipe(plugins.inject(vendorScripts, {relative: true, name: 'bower'}))
        .pipe(plugins.inject(appScripts, {relative: true}))
        .pipe(plugins.inject(vendorStyles, {relative: true, name: 'bower'}))
        .pipe(plugins.inject(appStyles, {relative: true}))
        .pipe(plugins.htmlmin({collapseWhitespace: true, removeComments: true}))
        .pipe(gulp.dest(paths.dist));
};

pipes.builtAppDev = function() {
    return es.merge(pipes.builtIndexDev(), pipes.builtPartialsDev(), pipes.processedImagesDev(), pipes.processedIconsDev(), pipes.builtVendorImagesDev());
};

pipes.builtAppProd = function() {
    return es.merge(pipes.builtIndexProd(), pipes.builtPartialsProd(), pipes.processedImagesProd(), pipes.processedIconsProd(), pipes.builtVendorImagesProd());
};

// == TASKS ========

// removes all compiled dev files
gulp.task('clean-dev', function() {
    var deferred = Q.defer();
    del(paths.dev, function() {
        deferred.resolve();
    });
    return deferred.promise;
});

// removes all compiled production files
gulp.task('clean-prod', function() {
    var deferred = Q.defer();
    del(paths.dist, function() {
        deferred.resolve();
    });
    return deferred.promise;
});


gulp.task('images', function () {
    return gulp.src([
            'src/images/**/*',
            'src/lib/images/*'])
        .pipe(gulp.dest('build/images'))
        .pipe(plugins.size());
});


// checks html source files for syntax errors
gulp.task('validate-partials', pipes.validatedPartials);

// checks index.html for syntax errors
gulp.task('validate-index', pipes.validatedIndex);

// moves html source files into the dev environment
gulp.task('build-partials-dev', pipes.builtPartialsDev);

// converts partials to javascript using html2js
//gulp.task('convert-partials-to-js', pipes.scriptedPartials);

// moves html partials into production environment (replaces convert-partials-to-js)
gulp.task('build-partials-prod', pipes.builtPartialsProd);

// runs jshint on the dev server scripts
//gulp.task('validate-devserver-scripts', pipes.validatedDevServerScripts);

// runs jshint on the app scripts
gulp.task('validate-app-scripts', pipes.validatedAppScripts);

// moves app scripts into the dev environment
gulp.task('build-app-scripts-dev', pipes.builtAppScriptsDev);

// concatenates, uglifies, and moves app scripts and partials into the prod environment
gulp.task('build-app-scripts-prod', pipes.builtAppScriptsProd);

// compiles app sass and moves to the dev environment
gulp.task('build-app-styles-dev', pipes.builtAppStylesDev);

// compiles and minifies app sass to css and moves to the prod environment
gulp.task('build-app-styles-prod', pipes.builtAppStylesProd);

// compiles and minifies vendor sass to css and moves to the prod environment
gulp.task('build-avendor-styles-prod', pipes.builtVendorStylesProd);

// moves vendor scripts into the dev environment
gulp.task('build-vendor-scripts-dev', pipes.builtVendorScriptsDev);

//moves vendor images into the dev environment
gulp.task('build-vendor-images-dev', pipes.builtVendorImagesDev);

// concatenates, uglifies, and moves vendor scripts into the prod environment
gulp.task('build-vendor-scripts-prod', pipes.builtVendorScriptsProd);

// validates and injects sources into index.html and moves it to the dev environment
gulp.task('build-index-dev', pipes.builtIndexDev);

// validates and injects sources into index.html, minifies and moves it to the dev environment
gulp.task('build-index-prod', pipes.builtIndexProd);

// builds a complete dev environment
gulp.task('build-app-dev', pipes.builtAppDev);

// builds a complete prod environment
gulp.task('build-app-prod', pipes.builtAppProd);

// cleans and builds a complete dev environment
gulp.task('clean-build-app-dev', ['clean-dev'], pipes.builtAppDev);

// cleans and builds a complete prod environment
gulp.task('clean-build-app-prod', ['clean-prod'], pipes.builtAppProd);

// clean, build, and watch live changes to the dev environment
gulp.task('watch-dev', ['build-app-dev'], function() {

    connect.server({
        root: 'dev',
        port: 9000,
        livereload: true
    });
    open("http://localhost:9000");

    // watch index
    gulp.watch(paths.index, function() {
        return pipes.builtIndexDev()
            //.pipe(plugins.livereload());
            .pipe(connect.reload());
    });

    // watch app scripts
    gulp.watch(paths.scripts, function() {
        return pipes.builtAppScriptsDev()
            //.pipe(plugins.livereload());
            .pipe(connect.reload());
    });

    // watch html partials
    gulp.watch(paths.partials, function() {
        return pipes.builtPartialsDev()
            //.pipe(plugins.livereload());
            .pipe(connect.reload());
    });

    // watch app styles
    gulp.watch(paths.appStyles, function() {
        return pipes.builtAppStylesDev()
            //.pipe(plugins.livereload());
            .pipe(connect.reload());
    });

});

// clean, build, and watch live changes to the prod environment
gulp.task('watch-prod', ['build-app-prod'], function() {

    connect.server({
        root: 'dist',
        port: 9001,
        livereload: true
    });
    open("http://localhost:9001");

    // watch index
    gulp.watch(paths.index, function() {
        return pipes.builtIndexProd()
            //.pipe(plugins.livereload());
            .pipe(connect.reload());
    });

    // watch app scripts
    gulp.watch(paths.scripts, function() {
        return pipes.builtAppScriptsProd()
            //.pipe(plugins.livereload());
            .pipe(connect.reload());
    });

    // watch html partials
    gulp.watch(paths.partials, function() {
        return pipes.builtAppScriptsProd()
            //.pipe(plugins.livereload());
            .pipe(connect.reload());
    });

    // watch app styles
    gulp.watch(paths.appStyles, function() {
        return pipes.builtAppStylesProd()
            //.pipe(plugins.livereload());
            .pipe(connect.reload());
    });

});

// default task builds for prod
gulp.task('default', ['clean-build-app-prod']);