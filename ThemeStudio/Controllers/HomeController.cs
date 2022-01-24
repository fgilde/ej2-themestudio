using LibSass.Compiler;
using LibSass.Compiler.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Linq;
using System.Text;
using System.Web.ModelBinding;
using System.Web.Mvc;

namespace ThemeStudio.Controllers
{
    public class HomeController : Controller
    {
        public class GZipOrDeflateAttribute : ActionFilterAttribute
        {
            public override void OnActionExecuting
                 (ActionExecutingContext filterContext)
            {
                string acceptencoding = filterContext.HttpContext.Request.Headers["Accept-Encoding"];
                if (!string.IsNullOrEmpty(acceptencoding))
                {
                    acceptencoding = acceptencoding.ToLower();
                    var response = filterContext.HttpContext.Response;
                    if (acceptencoding.Contains("gzip"))
                    {
                        response.AppendHeader("Content-Encoding", "gzip");
                        response.Filter = new GZipStream(response.Filter,
                                              CompressionMode.Compress);
                    }
                    else if (acceptencoding.Contains("deflate"))
                    {
                        response.AppendHeader("Content-Encoding", "deflate");
                        response.Filter = new DeflateStream(response.Filter,
                                          CompressionMode.Compress);
                    }
                }
            }
        }
        public class ThemeProperties
        {
            public string Theme { get; set; }
            public IDictionary<string, string> Properties { get; set; }
            public string[] Dependency { get; set; }
            public string[] Components { get; set; }
            public string File { get; set; }
            public string Compatiblity { get; set; }
        }

        public static string GetTimestamp(DateTime value)
        {
            return value.ToString("yyyyMMddHHmmssffff");
        }

        [GZipOrDeflate]
        public string ThemeChange(ThemeProperties color)
        {
            var changes = "";
            var timeStamp = GetTimestamp(DateTime.Now);
            var keys = color.Properties.Keys.ToArray();
            
            foreach (var key in keys){
                var value = color.Properties[key];
                changes += $"{key}:{value};\n";
            }

            var theme = color.Theme;
            var basePath = AppDomain.CurrentDomain.BaseDirectory.ToString();
            var templatepath = $"{basePath}template/";
            var templatefile = System.IO.File.ReadAllText(templatepath + theme + ".txt").Replace("{{:common}}", changes);

            var path = $"{basePath}ej2-resource/styles/";
            var filecontent = "";
            filecontent += templatefile;
            filecontent += System.IO.File.ReadAllText(path + "/all" + theme + ".scss");
            var outputdir = basePath + "resource/styles/";
            var ScssFilePath = outputdir + timeStamp;
            Directory.CreateDirectory(ScssFilePath);
            var sourcepath = ScssFilePath + "/" + theme + ".scss";

            System.IO.File.WriteAllText(sourcepath, filecontent);

            var result = sasscompiler(sourcepath);

            //delete all existing files and directories.
            sourcepath = ScssFilePath + "/" + theme + ".css";
            System.IO.File.WriteAllText(sourcepath, result);
            if (Directory.Exists(outputdir))
            {
                Directory.Delete(outputdir, true);
            }

            return result;
        }

        public string export(ThemeProperties exporting)
        {
            var themeName = exporting.Theme;

            var changes = "";
            var keys = exporting.Properties.Keys.ToArray();
            for (var i = 0; i < keys.Length; i++)
            {
                var value = exporting.Properties[keys[i]];
                changes += (keys[i] + ":" + value) + ";\n";
            }

            var filecontents = "";
            var basePath = AppDomain.CurrentDomain.BaseDirectory.ToString();
            var path = basePath + "ej2-resource/styles/";
            var componentsarray = exporting.Components;

            /* json file content*/
            dynamic settings = new JObject();
            settings.theme = themeName;
            settings["properties"] = JsonConvert.SerializeObject(exporting.Properties);
            settings["components"] = JsonConvert.SerializeObject(componentsarray);

            /* json file end */
            var foldername = exporting.File; // user declare download floder name

            //TODO exporting.dependency
            var deps = exporting.Dependency;
            var templatepath = basePath + "template/";
            if (themeName.IndexOf('-') != -1)
            {
                var darkpath = templatepath + "dark/";
                var templatefile = System.IO.File.ReadAllText(darkpath + themeName + ".txt");
                templatefile = templatefile.Replace("{{:common}}", changes as string);
                filecontents += templatefile;
                var paths = basePath + "ej2-resource/styles/";
                for (int i = 0; i < deps.Length; i++)
                {
                    if (deps[i] == "base")
                    {
                        paths += deps[i] + "/" + themeName + ".scss";
                        filecontents += System.IO.File.ReadAllText(paths);
                    }
                    else
                    {
                        var searchfilename = themeName + ".scss";
                        var sourcedirectories = basePath + "ej2-resource/styles/" + deps[i] + "/";
                        var files = Directory.GetFiles(sourcedirectories, searchfilename, SearchOption.AllDirectories);
                        foreach (var file in files)
                        {
                            filecontents += System.IO.File.ReadAllText(file);
                        }
                    }
                }
            }
            else
            {
                var templatefile = System.IO.File.ReadAllText(templatepath + themeName + ".txt");
                templatefile = templatefile.Replace("{{:common}}", changes);
                filecontents += templatefile;
                
                /* read a sass file */
                for (int i = 0; i < deps.Length; i++)
                {
                    if (deps[i] == "base")
                    {
                        path += deps[i] + "/" + themeName + ".scss";
                        filecontents += System.IO.File.ReadAllText(path);
                    }
                    else
                    {
                        var searchfilename = themeName + ".scss";
                        var sourcedirectories = basePath + "ej2-resource/styles/" + deps[i] + "/";
                        var files = Directory.GetFiles(sourcedirectories, searchfilename, SearchOption.AllDirectories);
                        foreach (var file in files)
                        {
                            filecontents += System.IO.File.ReadAllText(file);
                        }
                    }
                }
            }

            var bytes = new byte[4];
            var rng = System.Security.Cryptography.RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            uint random = BitConverter.ToUInt32(bytes, 0) % 100000000;
            var str = string.Format("{0:D8}", random);

            var timeStamp = GetTimestamp(DateTime.Now);
            var outputdir = basePath + "outputs/" + foldername + '-' + timeStamp + '-' + str + "/";
            Directory.CreateDirectory(outputdir);
            var sourcepath = outputdir + themeName + ".scss";
            System.IO.File.WriteAllText(sourcepath, filecontents);
            filecontents = ScssReader.ConvertScssVariablesToCssVars(sourcepath, true);

            var result = sasscompiler(sourcepath);
            
            /* compatibility css */
            var compatiblity = exporting.Compatiblity;
            if (compatiblity == "True")
            {
                var compataibilitydir = basePath + "outputs/" + foldername + '-' + timeStamp + '-' + str + "/compatibility/";
                Directory.CreateDirectory(compataibilitydir);
                //filecontents = filecontents.Replace("#{&}", ".e-control");
                System.IO.File.WriteAllText(compataibilitydir + themeName + ".scss", "$css: '.e-css' !default;\n$imported-modules: () !default;\n .e-lib { \n @at-root {\n" + filecontents + "}\n& .e-js [class^='e-'], & .e-js [class*=' e-'] {\n  box-sizing: content-box;\n }\n}");
                sourcepath = compataibilitydir + themeName + ".scss";
                var comptibilityresult = sasscompiler(sourcepath);
                System.IO.File.WriteAllText(compataibilitydir + themeName + ".css", comptibilityresult);
            }

            /* creation zip file */
            var zipPath = basePath + "outputzip";
            var zipTarget = zipPath + "/" + foldername + '-' + timeStamp + '-' + str + ".zip";
            var outputzip = "outputzip/" + foldername + '-' + timeStamp + '-' + str + ".zip";
            System.IO.File.WriteAllText(outputdir + themeName + ".css", result);
            System.IO.File.WriteAllText(outputdir + themeName + ".scss", filecontents);
            var settingsJson = JsonConvert.SerializeObject(settings);
            System.IO.File.WriteAllText(outputdir + "settings.json", settingsJson);
            Directory.CreateDirectory(zipPath);
            ZipFile.CreateFromDirectory(outputdir, zipTarget);
            if (Directory.Exists(outputdir))
            {
                Directory.Delete(outputdir, true);
            }

            return outputzip;
        }

        /* sass to css covert */
        public string sasscompiler(string sourcepath)
        {
            var options = new SassOptions
            {
                InputPath = sourcepath
            };
            var sass = new SassCompiler(options);
            var result = sass.Compile();
            return result.Output;
        }

        [HttpGet]
        public string themeProperties([QueryString] string theme)
        {
            string basePath = AppDomain.CurrentDomain.BaseDirectory.ToString();
            var path = basePath + "ej2-resource/styles/";

            var l = Directory.EnumerateFiles(path, $"{theme}.scss", SearchOption.AllDirectories);
            var vars = ScssReader.ReadVariables(l).Where(v => v.Type == ScssVariableType.Color && v.Value.Length == 7).ToList();
            var palette = vars.Select(v => v.Value).Where(v => v.StartsWith("#")).Distinct().ToArray();
            var paletteStr = string.Join(",", palette.Select(s => $"\"{s}\""));

            var builder = new StringBuilder();
            builder.Append("{");
            for (var index = 0; index < vars.Count; index++)
            {
                var variable = vars[index];
                builder.Append("\"" + variable.Name.Replace("Color", "") + "\" :{");
                builder.Append("\"id\": \"" + variable.Key.Replace("$", "") + "\",");
                builder.Append("\"default\": \"" + variable.Value + "\",");
                builder.Append("\"palettes\": [" + paletteStr + "]");
                builder.Append("}");
                if (index < vars.Count - 1)
                {
                    builder.Append(",");
                }
            }

            builder.Append("}");
            var jsonStr = builder.ToString();
            return jsonStr;
        }

        [GZipOrDeflate]
        public string loadtheme(ThemeProperties themes)
        {
            string theme = themes.Theme;

            string basePath = System.AppDomain.CurrentDomain.BaseDirectory.ToString();
            var path = basePath + "Content/ej2/" + theme + ".css";
            return System.IO.File.ReadAllText(path);
        }

        public string dark(ThemeProperties themes)
        {
            var theme = themes.Theme;
            var basePath = AppDomain.CurrentDomain.BaseDirectory.ToString();
            var path = basePath + "ej2-resource/styles/";
            var deps = themes.Dependency;
            var filecontents = "";
            /* read a sass file */
            for (int i = 0; i < deps.Length; i++)
            {
                if (deps[i] == "base")
                {
                    path += $"{deps[i]}/definition/{theme}.scss";
                    filecontents += System.IO.File.ReadAllText(path);
                    path = $"{basePath}ej2-resource/styles/";
                    path += $"{deps[i]}/{theme}.scss";
                    filecontents += System.IO.File.ReadAllText(path);
                }
                else
                {
                    var searchfilename = theme + ".scss";
                    var sourcedirectories = basePath + "ej2-resource/styles/" + deps[i] + "/";
                    var files = Directory.GetFiles(sourcedirectories, searchfilename, SearchOption.AllDirectories);
                    foreach (var file in files)
                    {
                        filecontents += System.IO.File.ReadAllText(file);
                    }
                }
            }
            var outputdir = basePath + "resource/styles/";

            Directory.CreateDirectory(outputdir);
            var sourcepath = outputdir + theme + ".scss";

            System.IO.File.WriteAllText(sourcepath, filecontents);

            var options = new SassOptions
            {
                InputPath = sourcepath
            };
            var sass = new SassCompiler(options);
            var result = sass.Compile();
            return result.Output;
        }
        public string DarkThemeChange(ThemeProperties color)
        {
            var sourcepath = "";
            var changes = "";
            var keys = color.Properties.Keys.ToArray();
            for (var i = 0; i < keys.Length; i++)
            {
                var value = color.Properties[keys[i]];
                changes += (keys[i] + ":" + value) + ";\n";
            }

            var theme = color.Theme;
            var basePath = AppDomain.CurrentDomain.BaseDirectory.ToString();
            var deps = color.Dependency;
            var templatepath = $"{basePath}template/dark/";
            var templatefile = System.IO.File.ReadAllText(templatepath + theme + ".txt");
            templatefile = templatefile.Replace("{{:common}}", changes as string);
            var filecontent = "";
            filecontent += templatefile;
            for (int i = 0; i < deps.Length; i++)
            {
                if (deps[i] == "base")
                {
                    var path = basePath + "ej2-resource/styles/";
                    path = $"{basePath}ej2-resource/styles/";
                    path = $"{path}{deps[i]}/{theme}.scss";
                    filecontent += System.IO.File.ReadAllText(path);
                }
                else
                {
                    var searchfilename = theme + ".scss";
                    var sourcedirectories = basePath + "ej2-resource/styles/" + deps[i] + "/";
                    var files = Directory.GetFiles(sourcedirectories, searchfilename, SearchOption.AllDirectories);
                    foreach (var file in files)
                    {
                        filecontent += System.IO.File.ReadAllText(file);
                    }
                }
            }
            var outputdir = basePath + "resource/styles/";
            var ScssFilePath = outputdir;
            Directory.CreateDirectory(ScssFilePath);
            sourcepath = ScssFilePath + "/" + theme + ".scss";

            System.IO.File.WriteAllText(sourcepath, filecontent);

            var result = sasscompiler(sourcepath);

            //delete all existing files and directories.
            sourcepath = ScssFilePath + "/" + theme + ".css";
            System.IO.File.WriteAllText(sourcepath, result);
            if (Directory.Exists(outputdir))
            {
                Directory.Delete(outputdir, true);
            }

            return result;
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