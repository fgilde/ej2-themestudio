using System;
using System.IO;
using System.IO.Compression;
using System.Linq;
using Microsoft.AspNetCore.Http;
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
        //public string Test(string theme)
        //{
        //    var t = Models.ThemeProperties.FromTheme(theme ?? Paths.DefaultTheme);
        //    var enumerable = t.GetDependencyFiles().ToList();
        //    return enumerable.Count + " Files" + Environment.NewLine + string.Join(Environment.NewLine, enumerable);
        //}

        [HttpPost]
        public string ThemeChange([FromBody] ThemeProperties color)
        {
            return Paths.ReadTemplateContent(color)
                .ReplaceWith(color)
                .AddContent(color)
                .CompileContent();
        }

        [HttpPost]
        public string Export([FromBody] ThemeProperties exporting, [FromQuery] string varTypes)
        {
            var zipFileName = $"{exporting.File}-{DateTime.Now.GetTimestamp()}-{Helper.Random.RandomNumberStr()}";
            var sassFilePath = Path.Combine(Directory.CreateDirectory(Path.Combine(Paths.Output, zipFileName)).FullName, $"{exporting.Theme}.scss");
            var allowedTypes = ScssHelper.ParseAllowedScssVariableTypes(varTypes);
            if (allowedTypes != null && !allowedTypes.Contains(ScssVariableType.Color))
                exporting = Models.ThemeProperties.FromTheme(exporting.Theme, exporting.Components);

            return Paths.ReadTemplateContent(exporting)
                .ReplaceWith(exporting)
                .AddContent(exporting)
                .ConvertScssVariablesToCssVariables(sassFilePath, allowedTypes)
                .CompileContent()
                .AddCompatibilityIf(exporting, Path.Combine(Paths.Output, zipFileName, "compatibility"))
                .ZipTo(exporting, zipFileName)
                .DeleteAfter(TimeSpan.FromSeconds(30))
                .GetRoute();
        }


        [HttpGet]
        public string ThemeProperties([FromQuery] string theme, [FromQuery] string varTypes)
        {
            return ScssHelper.ReadEditableVariables(Paths.GetAllScssFiles(theme), ScssHelper.ParseAllowedScssVariableTypes(varTypes)).ToThemePropertiesJson();
        }

        [HttpPost]
        public string LoadTheme([FromBody] ThemeProperties theme, [FromQuery] string varTypes)
        {
            //ScssHelper.ParseAllowedScssVariableTypes(varTypes)
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
        
        [HttpPost]
        //[SessionAuthorize]
        public ActionResult ImportOrUpdateTheme(IFormFile file)
        {
            string themeName = Path.GetFileNameWithoutExtension(file.FileName).Split("-").FirstOrDefault();
            if(file.ContentType != "application/zip" && file.ContentType != "application/x-zip-compressed")
                throw new NotSupportedException("Only zip files are supported");
            using (var stream = file.OpenReadStream())
            using (var archive = new ZipArchive(stream))
            {
                foreach (var entry in archive.Entries)
                {
                    if (entry.FullName == entry.Name) // Entry in root
                    {
                        var path = Path.Combine(Paths.ResourceStyles, $"all{entry.FullName}");
                        entry.ExtractToFile(path, true);
                    }
                    else
                    {
                        var entryFullName = entry.FullName.Replace("individual-scss/", "");
                        var path = Path.Combine(Paths.ResourceStyles, Path.GetDirectoryName(entryFullName));
                        var ext = Path.GetExtension(entry.FullName);
                        var target = Path.Combine(path, $"{themeName}{ext}");
                        if (!Directory.Exists(path))
                            Directory.CreateDirectory(path);
                        entry.ExtractToFile(target, true);
                    }
                    
                }
                // do something with the inner file
            }
            return RedirectToAction("Index");
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

        [SessionAuthorize]
        public ActionResult Upload()
        {
            ViewBag.Message = "Upload new Theme or Update existing";
            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}