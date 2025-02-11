﻿using System.IO;
using ThemeStudio.Helper.ScssHelper;

namespace ThemeStudio.Models
{
    public class TemplateContent
    {
        private string _content;

        public TemplateContent(string content)
        {
            _content = content;
        }

        public TemplateContent ReplaceWith(ThemeProperties theme)
        {
            return ReplacePlaceHolder(theme.ToSassVarDeclaration());
        }

        public TemplateContent ReplacePlaceHolder(string toReplaceWith)
        {
            _content = _content.Replace("{{:common}}", toReplaceWith);
            return this;
        }

        public static implicit operator string(TemplateContent d) => d._content;
        public static explicit operator TemplateContent(string s) => new(s);
        public override string ToString() => _content;

        public TemplateContent ConvertScssVariablesToCssVariables(string pathToSaveTo, ScssVariableType[] allowedTypes)
        {
            SaveTo(pathToSaveTo); // TODO: Eliminate double save, currently needed because Var reader needs a file at this moment
            _content = ScssHelper.ConvertScssVariablesToCssVars(pathToSaveTo, true, allowedTypes);
            return this;
        }

        public TemplateContent SaveTo(string filePath)
        {
            File.WriteAllText(filePath, _content);
            return this;
        }

        public TemplateContent AddContent(ThemeProperties theme)
        {
            return AddContent(theme.GetScssContent());
        }

        public TemplateContent AddContent(string content)
        {
            _content += content;
            return this;
        }
    }
}