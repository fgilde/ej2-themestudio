using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Web.ModelBinding;
using System.Web.Mvc;
using ThemeStudio.Attributes;
using ThemeStudio.Extensions;
using ThemeStudio.Helper;
using ThemeStudio.Helper.ScssHelper;
using ThemeStudio.Models;
using Random = ThemeStudio.Helper.Random;


namespace ThemeStudio.Controllers
{
    public class HomeController : Controller
    {
  
        [GZipOrDeflate]
        public string ThemeChange(ThemeProperties color)
        {
            return Pathes.ReadTemplateContent(color)
                .ReplaceWith(color)
                .AddContent(color)
                .CompileContent();
        }

        public string Export(ThemeProperties exporting)
        {
            var basePath = AppDomain.CurrentDomain.BaseDirectory;
            
            /* json file end */
            var foldername = $"{exporting.file}-{DateTime.Now.GetTimestamp()}-{Random.RandomNumberStr()}";
            var outputdir = Directory.CreateDirectory(Path.Combine(Pathes.Output, foldername)).FullName;
            var sourcepath = Path.Combine(outputdir, $"{exporting.theme}.scss");


            string filecontents = Pathes.ReadTemplateContent(exporting)
                .ReplaceWith(exporting)
                .AddContent(exporting, true)
                .ConvertScssVariablesToCssVariables(sourcepath);


            var result = SassCompile.CompileFile(sourcepath);
            /* compatibility css */
            if (exporting.compatiblity == "True")
            {
                var compataibilitydir = Directory.CreateDirectory(Path.Combine(Pathes.Output, foldername, "compatibility")).FullName;
                var fileName = Path.Combine(compataibilitydir, $"{exporting.theme}.scss");
                System.IO.File.WriteAllText(fileName,
                    "$css: '.e-css' !default;\n$imported-modules: () !default;\n .e-lib { \n @at-root {\n" +
                    filecontents +
                    "}\n& .e-js [class^='e-'], & .e-js [class*=' e-'] {\n  box-sizing: content-box;\n }\n}");
                var comptibilityresult = SassCompile.CompileFile(fileName);
                System.IO.File.WriteAllText(compataibilitydir + exporting.theme + ".css", comptibilityresult);
            }

            /* creation zip file */
            var zipPath = Directory.CreateDirectory(Path.Combine(basePath, Pathes.OutputZip)).FullName;
            var zipTarget = Path.Combine(zipPath, $"{foldername}.zip");
            
            System.IO.File.WriteAllText(Path.Combine(outputdir, $"{exporting.theme}.css"), result);
            System.IO.File.WriteAllText(Path.Combine(outputdir, $"{exporting.theme}.scss"), filecontents);
            System.IO.File.WriteAllText(Path.Combine(outputdir, "settings.json"), exporting.GetSettingsJson());
            
            ZipFile.CreateFromDirectory(outputdir, zipTarget);
            if (Directory.Exists(outputdir)) Directory.Delete(outputdir, true);

            return $"{Pathes.OutputZip}/{foldername}.zip";
        }


        [HttpGet]
        public string ThemeProperties([QueryString] string theme)
        {
            return ScssHelper.ReadVariables(Pathes.GetAllScssFiles(theme)).Where(v => v.Type == ScssVariableType.Color && v.Value.Length == 7)
                .ToThemePropertiesJson();
        }


        [GZipOrDeflate]
        public string LoadTheme(ThemeProperties themes)
        {
            return Pathes.ReadCssContent(themes.theme);
        }

        public string Dark(ThemeProperties themes)
        {
            return SassCompile.CompileContent(themes.GetDependenciesContent());
        }

        public string DarkThemeChange(ThemeProperties color)
        {
            return Pathes.ReadTemplateContent(color)
                .ReplaceWith(color)
                .AddContent(color)
                .CompileContent();
        }

        public ActionResult Index()
        {
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}