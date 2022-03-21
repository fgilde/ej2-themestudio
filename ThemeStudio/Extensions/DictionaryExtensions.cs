using System.Collections.Generic;

namespace ThemeStudio.Extensions
{
    public static class DictionaryExtensions
    {
        public static TValue AddValue<TKey, TValue>(this IDictionary<TKey, TValue> dictionary, TKey key, TValue value)
        {
            dictionary.Add(key,value);
            return value;
        }
    }
}