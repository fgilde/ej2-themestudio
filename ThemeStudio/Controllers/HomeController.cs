using System;
using System.IO;
using System.Linq;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ThemeStudio.Attributes;
using ThemeStudio.Extensions;
using ThemeStudio.Helper;
using ThemeStudio.Helper.ScssHelper;
using ThemeStudio.Models;

namespace ThemeStudio.Controllers
{
    public class HomeController : Controller
    {
        public string Test(string theme)
        {
            var t = Models.ThemeProperties.FromTheme(theme ?? Paths.DefaultTheme);
            var enumerable = t.GetDependencyFiles().ToList();
            return enumerable.Count + " Files" + Environment.NewLine + string.Join(Environment.NewLine, enumerable);
        }

        [HttpPost]
        public string ThemeChange([FromBody] ThemeProperties color)
        {
            return Paths.ReadTemplateContent(color)
                .ReplaceWith(color)
                .AddContent(color)
                .CompileContent();
        }

        [HttpPost]
        public string Export([FromBody] ThemeProperties exporting)
        {
            var zipFileName = $"{exporting.File}-{DateTime.Now.GetTimestamp()}-{Helper.Random.RandomNumberStr()}";
            var sassFilePath = Path.Combine(Directory.CreateDirectory(Path.Combine(Paths.Output, zipFileName)).FullName, $"{exporting.Theme}.scss");

            return Paths.ReadTemplateContent(exporting)
                .ReplaceWith(exporting)
                .AddContent(exporting)
                .ConvertScssVariablesToCssVariables(sassFilePath)
                .CompileContent()
                .AddCompatibilityIf(exporting, Path.Combine(Paths.Output, zipFileName, "compatibility"))
                .ZipTo(exporting, zipFileName)
                .DeleteAfter(TimeSpan.FromSeconds(30))
                .GetRoute();
        }


        [HttpGet]
        public string ThemeProperties([FromQuery] string theme)
        {
            return ScssHelper.ReadEditableVariables(Paths.GetAllScssFiles(theme)).ToThemePropertiesJson();
        }

        [HttpPost]
        public string LoadTheme([FromBody] ThemeProperties theme)
        {
            return ThemeChange(Models.ThemeProperties.FromTheme(theme.Theme ?? Paths.DefaultTheme));
        }

        [HttpPost]
        [SessionAuthorize]
        public string ApplyChanges([FromBody] ThemeProperties theme)
        {
            theme.GetChangedScssVariables().SaveChanges();
            theme.GetChangedScssVariables(new[] { Paths.AllScssFile(theme.Theme) }).SaveChanges();
            return Url.Action("Index", new { theme = theme.Theme });
        }

        [HttpPost]
        [SessionAuthorize]
        public string CreateNewTheme([FromBody] CreateNewThemeModel model)
        {
            return ApplyChanges(ThemeHelper.CreateNewTheme(model));
        }

        [HttpPost]
        [SessionAuthorize]
        public string DeleteTheme([FromBody] string theme)
        {
            ThemeHelper.DeleteTheme(theme);
            return Url.Action("Index");
        }

        [HttpPost]
        public string Dark([FromBody] ThemeProperties themes)
        {
            return SassCompile.CompileContent(themes.GetDependenciesContent());
        }

        [HttpPost]
        public string DarkThemeChange([FromBody] ThemeProperties color)
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