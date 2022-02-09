using System;
using System.Security.Cryptography;

namespace ThemeStudio.Helper
{
    public static class Random
    {
        public static string RandomNumberStr()
        {
            var bytes = new byte[4];
            var rng = RandomNumberGenerator.Create();
            rng.GetBytes(bytes);
            var random = BitConverter.ToUInt32(bytes, 0) % 100000000;
            return $"{random:D8}";
        }
    }
}