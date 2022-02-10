using System;
using System.Web;

namespace ThemeStudio.Helper
{
    public class ServerHelper
    {
        public static string MapPathReverse(string fullServerPath, bool trail = true)
        {
            var path = fullServerPath.Replace(HttpContext.Current.Request.PhysicalApplicationPath, string.Empty);
            return trail ? @"~\" + path : path;
        }
    }
}