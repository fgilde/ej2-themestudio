using System;

namespace ThemeStudio.Extensions
{
    public static class DateTimeExtensions
    {
        public static string GetTimestamp(this DateTime value)
        {
            return value.ToString("yyyyMMddHHmmssffff");
        }
    }
}