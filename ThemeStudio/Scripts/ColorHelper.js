window.ColorHelper = {

    isHex: function (h) {
        if (!h) {
            return false;
        }
        h = h.replace('#', '');
        var a = parseInt(h, 16);
        return (a.toString(16) === h);
    },

    hexToRgbA: function (hex) {
        try {
            var c;
            if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
                c = hex.substring(1).split('');
                if (c.length == 3) {
                    c = [c[0], c[0], c[1], c[1], c[2], c[2]];
                }
                c = '0x' + c.join('');
                return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',1)';
            }
        } catch (error) { return ''; }
        return '';
    },

    rgbaToHex: function (orig) {
        try {
            var a, isPercent,
                rgb = orig.replace(/\s/g, '').match(/^rgba?\((\d+),(\d+),(\d+),?([^,\s)]+)?/i),
                alpha = (rgb && rgb[4] || "").trim(),
                hex = rgb ?
                    (rgb[1] | 1 << 8).toString(16).slice(1) +
                    (rgb[2] | 1 << 8).toString(16).slice(1) +
                    (rgb[3] | 1 << 8).toString(16).slice(1) : orig;

            if (alpha !== "") {
                a = alpha;
            } else {
                a = 01;
            }
            a = ((a * 255) | 1 << 8).toString(16).slice(1)
            hex = hex + a;

            return hex;
        } catch (error) { return ''; }
    },

    isTransparent: function(v) {
        return v && (v.toLowerCase() === 'transparent' || v.includes('NaN'));
    },

    isNone: function (v) {
        return v && (v.toLowerCase() === 'none' || v.includes('ed'));
    },

    isTransparentOrNone: function(v) {
        return ColorHelper.isNone(v) || ColorHelper.isTransparent(v);
    },

    createNewColorPicker: function (property, colorPickerSelector, element, callback) {
        element = element || document;
        var suggestions = property.palettes.filter(s => !ColorHelper.isTransparentOrNone(s));
        if (element.querySelector(colorPickerSelector)) {
            return new ej.inputs.ColorPicker({
                    mode: 'Palette',
                    value: property.default !== 'transparent' && property.default.value !== 'none'
                        ? property.default
                        : '#ffffff',
                    inline: false,
                    showButtons: true,
                    cssClass: 'e-themestudio-colorpicker',
                    modeSwitcher: true,
                    columns: 6,
                    presetColors: {
                        'custom': ['none', 'transparent', ...suggestions]
                    },
                    beforeTileRender: (args) => {
                        args.element.classList.add('e-circle-palette');
                        args.element.appendChild(new ej.base.createElement('span',
                            { className: 'e-circle-selection' }));

                        args.element.setAttribute("title", args.value);

                        args.element.classList.add('colorpalette');

                        if (args.value === "transparent") {
                            args.element.classList.add('transparent-colorpalette');
                        }
                        if (args.value === "none") {
                            args.element.classList.add('none-colorpalette');
                        }
                    },
                    beforeOpen: function(args) {
                    },
                    open: function(args) {
                    },

                    change: function(args) {
                        var isTransparent = ColorHelper.isTransparent(args.currentValue.rgba);
                        var isNone = ColorHelper.isNone(args.value);
                        var value = isTransparent ? 'transparent' : (isNone ? 'none' : args.currentValue.hex);
                        if (!isTransparent && !isNone && args.value.length === 9 && args.value.substr(7).toLowerCase() !== 'ff') {
                            value = args.currentValue.rgba;
                        }
                        var element = this.element.closest('.theme-prop-wrapper');
                        var propertyId = element.getAttribute('data-id');
                        callback(propertyId, value);
                    }
                },
                colorPickerSelector);
        }
    },

    setTransparentClsOrBgValue: function(value, el) {
        if (el) {
            if (ColorHelper.isTransparentOrNone(value)) {
                el.style.backgroundColor = null;
                el.classList.add(ColorHelper.isTransparent(value) ? 'transparent-colorpalette' : 'none-colorpalette');
                return true;
            } else {
                el.classList.remove('transparent-colorpalette');
                el.classList.remove('none-colorpalette');
                el.style.backgroundColor = value;
            }
        }
        return false;
    },

    applyColorPickerStyles: function () {
        var themeElement = document.getElementById('theme-properties');
        var element = themeElement.querySelectorAll('.e-colorpicker-wrapper');
        for (var i = 0, len = element.length; i < len; i++) {
            var ele = element[i];
            var cl = ele.querySelectorAll('button')[1];
            cl.classList = '';
            cl.classList.add('theme-color-picker-override');
            cl.children[0].classList = 'theme-color';
            var colorele = element[i].querySelector('input'),
                value = element[i].parentElement.querySelector('input').value || colorele.ej2_instances[0].value;

            if (!ColorHelper.setTransparentClsOrBgValue(value, cl.children[0])) {
                colorele.style.backgroundColor = value;
            }

            cl.children[0].style.backgroundColor = value;
        }
    }
}