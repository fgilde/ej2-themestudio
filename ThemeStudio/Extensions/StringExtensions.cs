using System;
using System.Linq;

namespace ThemeStudio.Extensions;

public static class StringExtensions
{
    public static string SkipChars(this string str, params char[] chars)
    {
        return string.Join(string.Empty, str.SkipWhile(chars.Contains));
    }

    public static string EnsureStartsWith(this string str, char toStartWith)
    {
        return EnsureStartsWith(str, toStartWith.ToString());
    }

    public static string EnsureStartsWith(this string str, string toStartWith)
    {
        if (!str.StartsWith(toStartWith))
            str = toStartWith + str;
        return str;
    }

    public static string EnsureEndsWith(this string str, char toEndWith)
    {
        return EnsureEndsWith(str, toEndWith.ToString());
    }

    public static string EnsureEndsWith(this string str, string ending)
    {
        if (!str.EndsWith(ending))
            str += ending;
        return str;
    }

}