var gulp = require("gulp");
var glob = require("glob");
var fs = require("fs");
var shelljs = require("shelljs");



gulp.task("style-deps-json", function () {
    var style = JSON.parse(fs.readFileSync("./wwwroot/ej2-resource/styles.json", "utf8"));
    var packs = Object.keys(style);
    var tStyle = {};
    var compName = "";
    for (var pack of packs) {
        for (var comp of style[pack]) {
            if (!tStyle[pack]) {
                tStyle[pack] = {};
            }
            compName = Object.keys(comp)[0];
            tStyle[pack][compName] = comp[compName];
        }
    }
    fs.writeFileSync("styleDeps.json", JSON.stringify(tStyle), "utf8");
});

    

function themeName(name) {
    return name.slice(0, -5);
}
gulp.task("allscss", function () {
    var themes = ['material','fabric','bootstrap','bootstrap4','highcontrast'];
    for(var i =0 ;i<themes.length;i++){
        var styleFiles = glob.sync("./wwwroot/ej2-resource/styles/**/"+themes[i]+".scss");
        var styles = {};
        var content = "";
        var pathArray = [];
        var package = "";
        var component = "";
        var theme = "";
        for (var styleFile of styleFiles) {
            
            content = content+fs.readFileSync(styleFile, "utf8");
            
        }
       
        fs.writeFileSync("./wwwroot/ej2-resource/styles/all"+themes[i]+".scss", content, "utf8");

    }
   
});
gulp.task("clone", function () {
    shelljs.rm('-rf', './wwwroot/ej2-resources');
    shelljs.exec('git clone https://gitlab.syncfusion.com/essential-studio/ej2-resources -b master ej2-resources');

});
gulp.task("copy-file", function () {
    var pathBase = './wwwroot/ej2-resources';
    gulp.src([pathBase + '/styles/**/*'])
    .pipe(gulp.dest('./wwwroot/ej2-resource/styles/'));
    gulp.src([pathBase+'/*.json','!'+pathBase+'/package.json'])  
    .pipe(gulp.dest('./wwwroot/ej2-resource/'));
    
})
gulp.task("combine-json", function () {
    var style = JSON.parse(fs.readFileSync("styleDeps.json", "utf8"));
    var resource = JSON.parse(fs.readFileSync("./wwwroot/ej2-resource/resources.json", "utf8"));
    var combine = {styles:style, resources:resource }; 
    fs.writeFileSync("wwwroot/js/combine.js","window.dependentCollection="+ JSON.stringify(combine), "utf8")
});


gulp.task("build-Configuration", function(){
    shelljs.exec('gulp copy-file  style-deps-json allscss   combine-json');
});
gulp.task('themestudio-publish', function (done) {
    if (fs.existsSync('./third-party/asp-core')) {
        var user = process.env.GITLAB_USER;
        var token = process.env.GITLAB_TOKEN;
        var stageBranch = common.isMasterBranch ? 'master' : 'development';
        stageBranch = common.isReleaseBranch ? process.env.BRANCH_NAME : stageBranch;
        var ej2aspRepo = 'https://' + user + ':' + token + '@gitlab.syncfusion.com/essential-studio/ej2-asp-core.git';

        simpleGit('./third-party/asp-core').init()
            .add('.')
            .commit('(EJ2-000): ' + currentPackage + ' aspcore properties published')
            .push(ej2aspRepo, stageBranch, function () {
                console.log(currentPackage + ' - package published in github');
                done();
            });

    } else {
        done();
    }
});

