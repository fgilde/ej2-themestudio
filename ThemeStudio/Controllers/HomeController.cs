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
            return Paths.ReadTemplateContent(color)
                .ReplaceWith(color)
                .AddContent(color)
                .CompileContent()
                .CompiledContent;
        }

        public string Export(ThemeProperties exporting)
        {
            var zipFileName = $"{exporting.file}-{DateTime.Now.GetTimestamp()}-{Helper.Random.RandomNumberStr()}";
            var sassFilePath = Path.Combine(Directory.CreateDirectory(Path.Combine(Paths.Output, zipFileName)).FullName, $"{exporting.theme}.scss");

            return Paths.ReadTemplateContent(exporting)
                .ReplaceWith(exporting)
                .AddContent(exporting, true)
                .ConvertScssVariablesToCssVariables(sassFilePath)
                .CompileContent()
                .AddCompatibilityIf(exporting, Path.Combine(Paths.Output, zipFileName, "compatibility"))
                .ZipTo(exporting, zipFileName)
                .DeleteAfter(TimeSpan.FromSeconds(30))
                .GetRoute();
        }


        [HttpGet]
        public string ThemeProperties([QueryString] string theme)
        {
            var result = ScssHelper.ReadEditableVariables(Paths.GetAllScssFiles(theme)).ToThemePropertiesJson();
            return result;
        }

        [GZipOrDeflate]
        public string LoadTheme(ThemeProperties themes)
        {
            return ThemeChange(Models.ThemeProperties.FromTheme(themes.theme ?? Paths.DefaultTheme));
        }

        [HttpPost]
        [SessionAuthorize]
        public string ApplyChanges(ThemeProperties theme)
        {
            theme.GetChangedScssVariables().SaveChanges();
            theme.GetChangedScssVariables(new[] {Paths.AllScssFile(theme.theme)}).SaveChanges();
            return Url.Action("Index", new { theme.theme });
        }

        [HttpPost]
        [SessionAuthorize]
        public string CreateNewTheme(ThemeProperties theme, string baseTheme)
        {
            ThemeHelper.CreateNewTheme(theme.theme, baseTheme);
            return ApplyChanges(theme);
        }

        [HttpPost]
        [SessionAuthorize]
        public string DeleteTheme(string theme)
        {
            ThemeHelper.DeleteTheme(theme);
            return Url.Action("Index");
        }

        public string Dark(ThemeProperties themes)
        {
            return SassCompile.CompileContent(themes.GetDependenciesContent()).CompiledContent;
        }

        public string DarkThemeChange(ThemeProperties color)
        {
            return ThemeChange(color);
        }

        public string DefaultTheme()
        {
            return Paths.DefaultTheme;
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