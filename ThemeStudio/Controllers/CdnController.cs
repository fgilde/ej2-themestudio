using System;
using System.IO;
using System.Web.Mvc;
using Newtonsoft.Json;
using ThemeStudio.Extensions;
using ThemeStudio.Helper;
using ThemeStudio.Helper.ScssHelper;
using ThemeStudio.Models;

namespace ThemeStudio.Controllers
{
    public class CdnController : Controller
    {
        [HttpGet]
        [Route("style/{theme}/{type}")]
        public ContentResult Theme(string theme, string type)
        {
            var sassFilePath =
                Path.Combine(
                    Directory.CreateDirectory(Path.Combine(Paths.Output,
                        $"{theme}-{DateTime.Now.GetTimestamp()}-{Helper.Random.RandomNumberStr()}")).FullName,
                    $"{theme}.scss");

            ThemeProperties exporting = ThemeProperties.FromTheme(theme);

            var res = Paths.ReadTemplateContent(theme, theme.Contains("-dark"))
                .ReplaceWith(exporting)
                .AddContent(exporting, true)
                .ConvertScssVariablesToCssVariables(sassFilePath)
                .CompileContent();
            System.IO.File.Delete(sassFilePath);
            return Content(type == "css" ? res.CompiledContent : res.InitialContent,
                type == "css" ? "text/css" : "text/x-scss");
        }
    }
}