// generated on 2019-03-11 using generator-webapp 4.0.0-3
const {
	src,
	dest,
	watch,
	series,
	parallel,
	lastRun
} = require('gulp');
const gulpLoadPlugins = require('gulp-load-plugins');
const fs = require('fs');
const path = require('path');
const less = require('gulp-less');
const LessAutoprefix = require('less-plugin-autoprefix');
const autoprefix = new LessAutoprefix({
	browsers: ['last 2 versions']
});
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync');
const del = require('del');
const autoprefixer = require('autoprefixer');
const cssnano = require('cssnano');
const {
	argv
} = require('yargs');
const browserify = require('browserify');
const babelify = require('babelify');
const babel = require('gulp-babel');
const buffer = require('vinyl-buffer');
const source = require('vinyl-source-stream');
const data = require('gulp-data');
const fm = require('front-matter');
const chalk = require('chalk');
const $ = gulpLoadPlugins();
const zip = require('gulp-zip');
const moment = require('moment');
const rename = require("gulp-rename");
const uglify = require('gulp-uglify-es').default;

const server = browserSync.create();
const port = argv.port || 9000;

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';
const isDev = !isProd && !isTest;


function styles() {
	return src('app/sass/*.scss')
		.pipe($.plumber())
		.pipe($.if(!isProd, $.sourcemaps.init()))
		.pipe($.sass.sync({
			outputStyle: 'compressed',
			precision: 10,
			includePaths: ['.']
		}).on('error', $.sass.logError))
		.pipe($.postcss([
			autoprefixer()
		]))
		.pipe($.if(!isProd, $.sourcemaps.write()))
		.pipe(dest('.tmp/asset/css'))
		.pipe($.if(isProd, dest('dist/asset/css')))
		.pipe(server.reload({
			stream: true
		}));
}

function scripts() {
	let b = browserify({
		entries: 'app/js/main.js',
		transform: babelify,
		debug: !isProd
	});
	return b.bundle()
		.pipe(source('main.js'))
		.pipe($.plumber())
		.pipe(buffer())
		.pipe($.if(!isProd, $.sourcemaps.init({
			loadMaps: true
		})))
		.pipe($.if(!isProd, $.sourcemaps.write('.')))
		.pipe(dest('.tmp/asset/js'))
		.pipe(server.reload({
			stream: true
		}));
}

const lintBase = files => {
	return src(files)
		.pipe($.eslint({
			fix: true
		}))
		.pipe(server.reload({
			stream: true,
			once: true
		}))
		.pipe($.eslint.format())
		.pipe($.if(!server.active, $.eslint.failAfterError()));
}

function lint() {
	return lintBase('app/js/**/*.js')
		.pipe(dest('app/asset/js'));
}

function lintTest() {
	return lintBase('test/spec/**/*.js')
		.pipe(dest('test/spec'));
}

function html() {
	return src(['.tmp/*.html'])
		.pipe($.useref({
			searchPath: ['.tmp', 'app', '.']
		}))
		.pipe(dest('dist'));
}

function vendorJS() {
	return src(['dist/asset/js/vendor.js'])
		.pipe(uglify())
		.pipe($.plumber())
		.pipe(buffer())
		.pipe($.if(!isProd, $.sourcemaps.init({
			loadMaps: true
		})))
		.pipe($.if(!isProd, $.sourcemaps.write('.')))
		.pipe(rename('vendor.min.js'))
		.pipe(dest('dist/asset/js'));
}

function images() {
	return src('app/asset/images/**/*', {
			since: lastRun(images)
		})
		.pipe($.imagemin())
		.pipe($.if(!isProd, dest('.tmp/asset/images'), dest('dist/asset/images')));
}

function fonts() {
	return src('app/asset/fonts/**/*.{eot,svg,ttf,woff,woff2,otf}')
		.pipe($.if(!isProd, dest('.tmp/asset/fonts'), dest('dist/asset/fonts')));
}

function jsondata() {
	return src('app/resources/data/**/*')
		.pipe($.if(!isProd, dest('.tmp/resources/data'), dest('dist/resources/data')));
}

function extras() {
	return src([
		'app/*',
		'app/service-worker.js',
		'!app/content/*.yaml',
		'!app/content',
		'!app/html/*.html',
		'!app/html/*.twig',
		'!app/html'
	], {
		dot: true
	}).pipe(dest('dist'));
}

function serviceWorker() {
	return src([
			'app/service-worker.js',
		], {
			dot: true
		}).pipe(dest('.tmp'))
		.pipe($.if(isProd, dest('dist')))
		.pipe(server.reload({
			stream: true,
			once: true
		}));
}

function clean() {
	return del(['.tmp', 'dist'])
}

function measureSize() {
	return src('dist/**/*')
		.pipe($.size({
			title: 'build',
			gzip: true
		}));
}

const build = series(
	clean,
	series(parallel(twig, styles, serviceWorker, scripts, images, fonts, jsondata, extras), html),
	vendorJS,
	measureSize
);

function twig() {
	return src('app/html/*.twig')
		.pipe($.plumber())
		.pipe(data(function (file) {
			let yamlfile = path.basename(file.path).replace(path.extname(file.path), '.yaml');
			try {
				let yamlfullpath = path.resolve(path.dirname(file.path) + '/../content/' + yamlfile);
				if (fs.existsSync(yamlfullpath)) {
					var content = fm(String(fs.readFileSync(yamlfullpath)));
					console.log(chalk.yellow('Page ' + path.basename(file.path) + ' content loaded from ' + yamlfile));
					return content.attributes;
				}
			} catch (err) {
				console.error(err);
			}
			return;
		}))
		.pipe($.twig({
			pretty: true
		}))
		.pipe(dest('.tmp'))
		.pipe(server.reload({
			stream: true,
			once: true
		}));
}

function zipDist() {
	let timestamp = moment().format('YYYY-MM-DD_hh-mm-ss');
    return src('dist/**/*')
        .pipe(zip('blog-'+timestamp+'.zip'))
        .pipe(dest('packages'));
}

function startAppServer() {
	server.init({
		notify: false,
		ghostMode: false,
		port,
		server: {
			baseDir: ['.tmp', 'app/html'],
			directory: true,
			routes: {
				'/node_modules': 'node_modules',
				'/vendor': 'vendor'
			}
		},
		https: true
	});

	watch([
		'app/content/**/*',
		'app/asset/images/**/*',
		'.tmp/asset/fonts/**/*',
		'.tmp/resources/data/**/*'
	]).on('change', server.reload);
	watch('app/asset/images/**/*', images);
	watch('app/resources/data/**/*', jsondata);

	watch('app/html/**/*.twig', twig);
	watch('app/sass/**/*.scss', styles);
	watch('app/*.js', serviceWorker);
	watch('app/js/**/*.js', scripts);
	watch('app/asset/fonts/**/*', fonts);
}

function startTestServer() {
	server.init({
		notify: false,
		ghostMode: false,
		port,
		ui: false,
		server: {
			baseDir: 'test',
			routes: {
				'/js': '.tmp/asset/js',
				'/node_modules': 'node_modules'
			}
		}
	});

	watch('app/*.js', serviceWorker);
	watch('app/js/**/*.js', scripts);
	watch(['test/spec/**/*.js', 'test/index.html']).on('change', server.reload);
	watch('test/spec/**/*.js', lintTest);
}

function startDistServer() {
	server.init({
		notify: false,
		ghostMode: false,
		port,
		server: {
			baseDir: 'dist',
			directory: true,
			routes: {
				'/node_modules': 'node_modules',
				'/vendor': 'vendor'
			}
		}
	});
}

let serve;

if (isDev) {
	serve = series(clean, parallel(twig, styles, serviceWorker, scripts, images, fonts, jsondata), startAppServer);
} else if (isTest) {
	serve = series(clean, scripts, startTestServer);
} else if (isProd) {
	serve = series(build, startDistServer);
}

let package = series(build, zipDist);

exports.serve = serve;
exports.build = build;
exports.default = build;
exports.package = package;
