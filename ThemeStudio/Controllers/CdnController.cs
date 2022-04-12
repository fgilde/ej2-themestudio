using System;
using System.IO;
using Microsoft.AspNetCore.Mvc;
using ThemeStudio.Extensions;
using ThemeStudio.Helper;
using ThemeStudio.Models;

namespace ThemeStudio.Controllers
{
    public class CdnController : Microsoft.AspNetCore.Mvc.Controller
    {
        [HttpGet]
        [Route("theme/{theme}/{type}/{components?}")]
        public ContentResult Theme(string theme, string type, string components)
        {
            var sassFilePath = Path.Combine(Directory.CreateDirectory(Path.Combine(Paths.Output, $"{theme}-{DateTime.Now.GetTimestamp()}-{Helper.Random.RandomNumberStr()}")).FullName, $"{theme}.scss");

            ThemeProperties exporting = ThemeProperties.FromTheme(theme, components != null ? components.Split(',') : null);

            var res = Paths.ReadTemplateContent(theme, theme.Contains("-dark"))
                .ReplaceWith(exporting)
                .AddContent(exporting)
                .ConvertScssVariablesToCssVariables(sassFilePath)
                .CompileContent();
            System.IO.File.Delete(sassFilePath);
            return Content(type == "css" ? res.CompiledContent : res.InitialContent, type == "css" ? "text/css" : "text/x-scss");
        }

    }
}