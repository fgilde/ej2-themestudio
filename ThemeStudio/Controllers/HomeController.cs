using System;
using System.IO;
using System.Linq;
using System.Web.ModelBinding;
using System.Web.Mvc;
using ThemeStudio.Attributes;
using ThemeStudio.Extensions;
using ThemeStudio.Helper;
using ThemeStudio.Helper.ScssHelper;
using ThemeStudio.Models;

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
                .CompileContent()
                .CompiledContent;
        }

        public string Export(ThemeProperties exporting)
        {
            var zipFileName = $"{exporting.file}-{DateTime.Now.GetTimestamp()}-{Helper.Random.RandomNumberStr()}";
            var sassFilePath = Path.Combine(Directory.CreateDirectory(Path.Combine(Pathes.Output, zipFileName)).FullName, $"{exporting.theme}.scss");
            
            return Pathes.ReadTemplateContent(exporting)
                .ReplaceWith(exporting)
                .AddContent(exporting, true)
                .ConvertScssVariablesToCssVariables(sassFilePath)
                .CompileContent()
                .AddCompatibilityIf(exporting, Path.Combine(Pathes.Output, zipFileName, "compatibility"))
                .ZipTo(exporting, zipFileName)
                .DeleteAfter(TimeSpan.FromSeconds(30))
                .GetRoute();
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
            return SassCompile.CompileContent(themes.GetDependenciesContent()).CompiledContent;
        }

        public string DarkThemeChange(ThemeProperties color)
        {
            return ThemeChange(color);
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