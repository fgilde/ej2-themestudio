// Theme properties
var useNativeColorCtrl = false;
var virtualizeThemeProperties = true;

var varTypeFilter = ['Color']; // Default Typefilter color
var defaultVal = {};
var themeColors = {};
var exportDialog, importDialog, filterDialog, loginDialog, createDialog;
var curThemeName = curTheme = lastRenderedTheme = '';

var controlContent;
var colorchange = {};
var themeSwitherPopup;
var themeDropDownStatus = false;
var themeDropDown = document.getElementById('dropdownMenu1');
var themeDropDownText = document.getElementById('themeDropText');
var componentsId = [];
var clrpkrWrapper;
var checking = [];
var queryRegex = /\?+[^>]+/g;
var googleAngRegex = /\&+[^>]+/g;

//var element = document.getElementById("controls");
var themeProps = {};

function initTypeFilter() {
    if (varTypeFilter && varTypeFilter.length) {
        varTypeFilter.forEach(value => {
            $('#variableTypeFilter').val(value);
        });
    }
    updateCdnLinksWithFilter();
    $('#variableTypeFilter').select2();
    $("#variableTypeFilter").change(function (a) {
        varTypeFilter = a.val;
        updateCdnLinksWithFilter();
        renderProperties(curThemeName, true);
    });
}
initTypeFilter();

function filterChanged(event) {
    if (virtualizeThemeProperties) {
        _renderProperties(lastRenderedTheme);
        return;
    }
    document.querySelectorAll('.theme-prop-wrapper').forEach(function (el) {
        if (_match(event.target.value, el)) {
            el.style.display = 'block';
        } else {
            el.style.display = 'none';
        }
    });
}

function _match(search, el) {
    if (!search || !search.length) {
        return true;
    }
    search = search.toLowerCase();

    var dataId = (el instanceof HTMLElement) ? el.getAttribute('data-id')?.toLowerCase() : el.id,
        component = (el instanceof HTMLElement) ? el.getAttribute('component-id')?.toLowerCase() : el.component,
        label = (el instanceof HTMLElement) ? el.querySelector('label')?.innerText.toLowerCase() : el.id,
        value = (el instanceof HTMLElement) ? el.querySelector('input').value.toLowerCase() : el.default,
        hex = ColorHelper.isHex(value) ? value : (value?.startsWith('rgb') ? ColorHelper.rgbaToHex(value) : ''),
        rgba = value?.startsWith('rgb') ? value : ColorHelper.hexToRgbA(value),
        toSearchIn = [dataId, label, value, hex, rgba, component];

    return toSearchIn.some(s => s?.indexOf(search) > -1);

}


function loadJson() {
    getThemeColors();
    renderDialogs();

    var queystring = window.location.search;
    if (queystring.indexOf("?theme=") !== -1) {
        queystring = queystring.replace(googleAngRegex, "");
        queystring = queystring.replace("?theme=", "");
        queystring = queystring.trim();
        loadTheme(queystring, false);
        renderRightPane();
    } else {
        loadDefaultThemes(null, false);
    }

}
loadJson();

function getThemeColors() {
    var themes = Object.keys(themeProps);
    themeColors = {}
    for (var i = 0; i < themes.length; i++) {
        var properties = themeProps[themes[i]];
        var keys = Object.keys(properties);
        var colors = {};
        for (var j = 0; j < keys.length; j++) {
            var p = properties[keys[j]];
            colors['$' + p.id] = p.default;
        }
        themeColors[themes[i]] = colors;
    }
    defaultVal = ej.base.extend({}, themeColors, {}, true);
}

// Render the right pane components
function renderRightPane() {
    // theme switcher datasource

    themeSwitherPopup = new ej.popups.Popup(document.getElementById('theme-switcher-popup'), {

        relateTo: themeDropDown,
        position: { X: 'left', Y: 'bottom' },
        collision: { X: 'flip', Y: 'flip' },
        offsetY: 2,
        open: function () {
            themeDropDownStatus = true;
        },
        close: function () {
            themeDropDownStatus = false;
        }
    });
    themeDropDown.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        togglePopup(themeDropDownStatus);
    });
    function togglePopup(status) {
        themeSwitherPopup[status ? 'hide' : 'show']();
    }
    document.addEventListener('click', function () { togglePopup(true) });
    document.getElementById('themelist').addEventListener('click', function (e) {
        var parent = e.target.closest('li');
        var theme = parent.id;
        if (theme === curTheme) {
            return;
        }
        var text = parent.querySelector('.switch-text').innerHTML;
        document.querySelector('#themelist>.active').classList.remove('active');
        document.querySelector('#themelist>#' + theme).classList.add('active');
        themeDropDownText.innerHTML = text;
        curTheme = theme;
        //window.location.href = window.location.origin;
        themeSwitherPopup.hide();
        var isDark = document.getElementById("dark").ej2_instances[0].checked;
        if (isDark) {
            if (theme !== "highcontrast" && theme !== "bootstrap4" && theme !== "fusion") {
                theme = theme + "-dark";
            }
        } else {
            theme = theme;
        }
        renderProperties(theme);
        loadTheme(theme, true);
    });

    var queystring = window.location.search;
    if (queystring) {
        queystring = queystring.replace("?theme=", "");
        queystring = queystring.trim();
        renderProperties(queystring);
        if (queystring.indexOf('-') !== -1) {
            curThemeName = queystring.replace("-dark", '');
            curThemeName = curThemeName.trim();
        } else {
            curThemeName = queystring;
        }

        themeDropDownText.innerHTML = curThemeName;
        document.querySelector('#themelist>.active').classList.remove('active');
        document.querySelector('#themelist>#' + curThemeName).classList.add('active');
    } else {
        renderProperties(curThemeName || 'material');
    }
    // rendering theme mode light/dark
    var themeMode = new ej.buttons.RadioButton({
        label: 'Light', name: 'theme-mode', value: 'Light', checked: true,
        change: function (e) {
            var themes = curTheme;
            if (themes === "highcontrast") {
                themes = themes + "-light";
                renderProperties(themes);
                loadTheme(themes, true);
            } else {
                renderProperties(themes);
                loadTheme(themes, true);
            }
        }
    });
    themeMode.appendTo('#light');

    themeMode = new ej.buttons.RadioButton({
        label: 'Dark', name: 'theme-mode', value: 'Dark',
        change: function (e) {
            var themes = curTheme;
            if (themes !== "highcontrast") {
                themes = themes + "-dark";
                renderProperties(themes);
                loadTheme(themes, true);
            } else {
                renderProperties(themes);
                loadTheme(themes, true);
            }
        }
    });
    themeMode.appendTo('#dark');

    colorpicker();
}

function loadThemeProperties(theme, callback, force) {
    var objectName = theme.replace('-', '');
    if (force) {
        themeProps[objectName] = {};
    }
    themeProps[objectName] = themeProps[objectName] || {};
    if (themeProps[objectName]._varsLoaded) {
        callback();
    } else {
        var url = '/Home/ThemeProperties?theme=' + theme;
        if (varTypeFilter && varTypeFilter.length) {
            url += '&varTypes=' + varTypeFilter.join(',');
        }
        fetch(url)
            .then(response => response.json())
            .then(data => {
                Object.assign(themeProps[objectName], data);
                themeProps[objectName]._varsLoaded = true;
                getThemeColors();
                callback();
            });
    }
}

function loadDefaultThemes(theme, isRightpanerender) {
    if (theme) {
        _loadDefaultThemes(theme, isRightpanerender);
    } else {
        fetch('/Home/DefaultTheme')
            .then(response => response.text())
            .then(t => {
                curTheme = curThemeName = t;
                _loadDefaultThemes(t, isRightpanerender);
            });
    }
}

function applyCustomThemePreview(data) {
    var styles = document.getElementById('custom-theme');
    styles.innerHTML = data;
}

function _loadDefaultThemes(theme, isRightpanerender) {
    window.themes = theme;
    var themeObj = {};
    themeObj['theme'] = theme;
    var baseurl = window.location.href;
    if (baseurl.match(queryRegex)) {
        baseurl = baseurl.replace(queryRegex, "");
        baseurl = baseurl.trim();
    }
    var str = "";
    str = "?theme=" + theme;
    if (!window.location.href.includes(str.substring(1))) {
        window.location.href = '/' + str;
        return;
    }
    history.replaceState({}, '', baseurl + str);
    curTheme = theme;
    themeColors = ej.base.extend({}, defaultVal, {}, true);

    var loadThemeUrl = "/Home/LoadTheme";
    if (varTypeFilter && varTypeFilter.length) {
        loadThemeUrl += '?varTypes=' + varTypeFilter.join(',');
    }
    var ajax = new ej.base.Ajax({
        type: "POST",
        url: loadThemeUrl,
        contentType: 'application/json; charset=utf-8',
        processData: false,
        data: JSON.stringify(themeObj) // Note it is important
    }, 'POST', true);
    ajax.send();
    ajax.onSuccess = function (data) {
        applyCustomThemePreview(data);
        if (isfilterapplied) {
            generatefilterhtml();
        }
        else {
            destroyControls();

            renderComponents();
            if (!isRightpanerender) {
                renderRightPane();
            }

        }

        setTimeout(function () {
            removeOverlay(true);
            twocolumn_layout();
        }, 500);

        $('.theme-filter-header').show();
        setTimeout(function () {
            window.dispatchEvent(new Event('resize'));
        }, 500);
    };
}


var themeBodyLeftOverlay = ej.base.select('.theme-body-left-ovelay');

function renderComponents() {
    //ej.base.select('.sb-body-overlay').classList.remove('sb-hide');
    var isMaterial = curTheme === 'material' || curTheme === 'material-dark';
    ej.base.enableRipple(isMaterial);
    if (!controlContent) {
        cardelements = $('.layout-card');
        cardsContent = {};
        for (let i = 0; i < cardelements.length; i++) {
            cardsContent[cardelements[i].id] = cardelements[i].outerHTML;
        };
        controlContent = $('#controls').html();
    } else {
        if (!isfilterapplied) {
            $('#controls').html(controlContent);
        }
    }
    if ($("#component-numeric").length) {
        var numeric = new ej.inputs.NumericTextBox({
            value: 15
        });
        numeric.appendTo('#component-numeric');
    }
    if ($("#component-maskedtextbox").length) {
        var masked = new ej.inputs.MaskedTextBox({
            mask: '000-000-0000'
        });
        masked.appendTo('#component-maskedtextbox');
    }
    if ($("#component-slider").length) {
        var defaultObj = new ej.inputs.Slider({
            tooltip: { isVisible: true, showOn: 'Focus' },
            type: 'MinRange'
        });
        defaultObj.appendTo('#component-slider');
        defaultObj.value = 30;
    }

    //{ field: 'Freight', width: 120, format: 'C', textAlign: 'Right' }
    //{ field: 'CustomerID', headerText: 'Customer Name', width: 150 },
    if ($("#component-grid").length) {
        var grid = new ej.grids.Grid({
            dataSource: window.gridData,
            allowPaging: true,

            groupSettings: { columns: ['OrderID'] },
            allowFiltering: true,
            filterSettings: { type: 'Menu' },
            pageSettings: { pageCount: 3, pageSize: 3 },
            actionComplete: function (args) {
                if (args.requestType === 'grouping') {
                    grid.pageSettings.pageSize = 3;
                }
                if (args.requestType === 'ungrouping') {
                    grid.pageSettings.pageSize = 6;
                }

            },
            allowGrouping: true,
            columns: [
                { field: 'OrderID', headerText: 'Order ID', width: 120 },
                { field: 'OrderDate', headerText: 'Order Date', format: 'yMd', width: 120 },
                { field: 'Freight', width: 120, format: 'C2', width: 130 },
                { field: 'ShippedDate', headerText: 'Shipped Date', format: 'yMd', width: 180 },
                { field: 'ShipCountry', headerText: 'Ship Country', width: 150 }
            ]
        });
        grid.appendTo('#component-grid');
    }

    var sportsData = ['Badminton', 'Basketball', 'Cricket',
        'Football', 'Golf', 'Gymnastics',
        'Hockey', 'Rugby', 'Snooker', 'Tennis'];

    if ($("#component-autcomplete").length) {
        // initialize AutoComplete component
        var atcObj = new ej.dropdowns.AutoComplete({
            //set the data to dataSource property
            dataSource: sportsData,
            // set the placeholder to AutoComplete input element
            placeholder: 'e.g. Basketball'
        });
        atcObj.appendTo('#component-autcomplete');
    }

    if ($("#component-dropdownlist").length) {
        var listObj = new ej.dropdowns.DropDownList({
            index: 2,
            placeholder: 'Select a game',
            popupHeight: '200px',

        });
        listObj.appendTo('#component-dropdownlist');
    }



    if ($("#dialogComponent").length) {
        ej.popups.Dialog.prototype.focusContent = function () { }
        var dlgObj = new ej.popups.Dialog({
            header: 'Delete Multiple Items',
            content: '<span>Are you sure you want to permanently delete these items ?</span>',
            target: document.getElementById('theme-dialog-wrapper'),
            showCloseIcon: true,
            buttons: [{
                click: confirmDlgBtnClick,
                buttonModel: { content: 'Yes', isPrimary: true }
            },
            { click: confirmDlgBtnClick, buttonModel: { content: 'No' } }],
            width: '40%',
            isModal: true,
            animationSettings: { effect: 'None' }
        });
        dlgObj.appendTo('#dialogComponent');
        function confirmDlgBtnClick() {
            dlgObj.hide();
        }

        // Create Button to open the confirmation Dialog
        var confirmBtn = new ej.buttons.Button({});
        confirmBtn.appendTo('#confirmBtn');
        document.getElementById('confirmBtn').onclick = function () {
            dlgObj.show();
        };

    }


    if ($("#component-multiselect").length) {
        var listObj = new ej.dropdowns.MultiSelect({
            placeholder: 'Favorite Sports',
            mode: 'Box'
        });
        listObj.appendTo('#component-multiselect');
    }

    if ($("#component-combobox").length) {
        var comboBoxObj = new ej.dropdowns.ComboBox({
            dataSource: window.ddCountryData,
            fields: { text: 'Name', value: 'Code' },
            placeholder: 'Select a country',
            popupHeight: '270px',
            allowFiltering: true,
            filtering: function (e) {
                var query = new ej.data.Query();
                query = (e.text !== '') ? query.where('Name', 'startswith', e.text, true) : query;
                e.updateData(window.ddCountryData, query);
            }
        });
        comboBoxObj.appendTo('#component-combobox');
    }

    if ($("#component-datepicker").length) {
        var datepicker = new ej.calendars.DatePicker();
        datepicker.appendTo('#component-datepicker');
    }

    if ($("#component-timepicker").length) {
        var timepicker = new ej.calendars.TimePicker();
        timepicker.appendTo('#component-timepicker');
    }

    if ($("#component-datetimepicker").length) {
        var datetimepicker = new ej.calendars.DateTimePicker();
        datetimepicker.appendTo('#component-datetimepicker');
    }

    if ($("#component-daterangepicker").length) {
        var daterangepicker = new ej.calendars.DateRangePicker();
        daterangepicker.appendTo('#component-daterangepicker');
    }

    if ($("#primarybtn").length) {
        var button = new ej.buttons.Button({ isPrimary: true });
        button.appendTo('#primarybtn');
    }

    if ($("#normalbtn").length) {
        button = new ej.buttons.Button({});
        button.appendTo('#normalbtn');
    }

    if ($("#outlinebtn").length) {
        button = new ej.buttons.Button({ cssClass: 'e-outline', isPrimary: true });
        button.appendTo('#outlinebtn');
    }

    if ($("#flatbtn").length) {
        button = new ej.buttons.Button({ cssClass: 'e-flat' });
        button.appendTo('#flatbtn');
    }

    if ($("#successbtn").length) {
        button = new ej.buttons.Button({ cssClass: 'e-success' });
        button.appendTo('#successbtn');
    }

    if ($("#warningbtn").length) {
        button = new ej.buttons.Button({ cssClass: 'e-warning' });
        button.appendTo('#warningbtn');
    }

    if ($("#togglebtn").length) {
        var toggleBtn = new ej.buttons.Button({ iconCss: 'e-btn-sb-icons e-play-icon', cssClass: 'e-flat e-primary', isToggle: true });
        toggleBtn.appendTo('#togglebtn');
        //Toggle button click event handler
        toggleBtn.element.onclick = function () {
            if (toggleBtn.element.classList.contains('e-active')) {
                toggleBtn.content = 'Pause';
                toggleBtn.iconCss = 'e-btn-sb-icons e-pause-icon';
            } else {
                toggleBtn.content = 'Play';
                toggleBtn.iconCss = 'e-btn-sb-icons e-play-icon';
            }
        };
    }


    if ($("#component-calendar").length) {
        var calendar = new ej.calendars.Calendar({});
        calendar.appendTo('#component-calendar');
    }


    var items = [
        {
            text: 'Dashboard',
            iconCss: 'e-ddb-icons e-dashboard'
        },
        {
            text: 'Notifications',
            iconCss: 'e-ddb-icons e-notifications',
        },
        {
            text: 'User Settings',
            iconCss: 'e-ddb-icons e-settings',
        },
        {
            text: 'Log Out',
            iconCss: 'e-ddb-icons e-logout'
        }];

    if ($("#textbtn").length) {
        btnObj = new ej.splitbuttons.DropDownButton({ items: items });
        btnObj.appendTo('#textbtn');
    }

    if ($("#icontextbtn").length) {
        btnObj = new ej.splitbuttons.DropDownButton({ items: items, iconCss: 'e-ddb-icons e-profile', cssClass: 'e-primary' });
        btnObj.appendTo('#icontextbtn');
    }


    if ($("#custombtn").length) {
        btnObj = new ej.splitbuttons.DropDownButton({ items: items, cssClass: 'e-caret-hide' });
        btnObj.appendTo('#custombtn');
    }
    var sitems = [
        {
            text: 'Paste',
            iconCss: 'e-btn-icons e-paste'
        },
        {
            text: 'Paste Special',
            iconCss: 'e-btn-icons e-paste-special'
        },
        {
            text: 'Paste as Formula',
            iconCss: 'e-btn-icons e-paste-formula'
        },
        {
            text: 'Paste as Hyperlink',
            iconCss: 'e-btn-icons e-paste-hyperlink'
        }
    ];

    if ($("#iconsplitbtn").length) {
        var splitButton = new ej.splitbuttons.SplitButton({ items: sitems, iconCss: 'e-btn-icons e-paste' });
        splitButton.appendTo('#iconsplitbtn');
    }

    if ($("#textsplitbtn").length) {
        splitButton = new ej.splitbuttons.SplitButton({ items: sitems, content: 'Paste', cssClass: 'e-primary' });
        splitButton.appendTo('#textsplitbtn');
    }

    if ($("#loginsplitbutton").length) {
        var loginBtn = new ej.splitbuttons.SplitButton({
            click: () => window.location.href = `/login?theme=${curTheme}`,
            select: a => a.item.click(a),
            items: [
                {
                    text: 'External',
                    click: () => window.location.href = `/login?theme=${curTheme}`
                },
                {
                    text: 'Internal',
                    click: () => loginDialog.show()

                },
            ], content: 'Login', cssClass: 'e-primary', iconCss: 'e-btn-icons e-profile'
        });
        loginBtn.appendTo('#loginsplitbutton');
    }

    if ($("#icontextsplitbtn").length) {
        splitButton = new ej.splitbuttons.SplitButton({ items: sitems, content: 'Paste', iconCss: 'e-btn-icons e-paste' });
        splitButton.appendTo('#icontextsplitbtn');
    }
    if ($("#listview-def").length) {
        var listObj = new ej.lists.ListView({
            dataSource: window.listData,
            fields: { groupBy: 'category' }
        });


        //Render initialized ListView component
        listObj.appendTo('#listview-def');
    }

    if ($("#treeviewComponent").length) {
        var treeObj = new ej.navigations.TreeView({
            fields: { dataSource: window.hierarchicalData, id: 'id', text: 'name', child: 'subChild' }
        });
        treeObj.appendTo('#treeviewComponent');
    }

    if ($("#Accordion_icon").length) {
        var accordion = new ej.navigations.Accordion({
            items: [
                { header: 'Athletics', iconCss: 'e-athletics e-acrdn-icons', content: '#athletics', expanded: true },
                { header: 'Water Games', iconCss: 'e-water-game e-acrdn-icons', content: '#water_games' },
                //{ header: 'Racing', iconCss: 'e-racing-games e-acrdn-icons', content: '#racing_games' },
                //{ header: 'Indoor Games', iconCss: 'e-indoor-games e-acrdn-icons', content: '#indoor_games' }
            ]
        });
        //Render initialized Accordion component
        accordion.appendTo('#Accordion_icon');
    }

    if ($("#tabComponent").length) {
        var tabObj = new ej.navigations.Tab({
            items: [
                {
                    header: { 'text': 'Twitter' },
                    content: 'Twitter is an online social networking service that enables users to send and read short 140-character ' +
                        'messages called "tweets". Registered users can read and post tweets, but those who are unregistered can only read ' +
                        'them. Users access Twitter through the website interface, SMS or mobile device app Twitter Inc. is based in San ' +
                        'Francisco and has more than 25 offices around the world. Twitter was created in March 2006 by Jack Dorsey, ' +
                        'Evan Williams, Biz Stone, and Noah Glass and launched in July 2006. The service rapidly gained worldwide popularity, ' +
                        'with more than 100 million users posting 340 million tweets a day in 2012.The service also handled 1.6 billion ' +
                        'search queries per day.'
                },
                {
                    header: { 'text': 'Facebook' },
                    content: 'Facebook is an online social networking service headquartered in Menlo Park, California. Its website was ' +
                        'launched on February 4, 2004, by Mark Zuckerberg with his Harvard College roommates and fellow students Eduardo ' +
                        'Saverin, Andrew McCollum, Dustin Moskovitz and Chris Hughes.The founders had initially limited the website\'\s ' +
                        'membership to Harvard students, but later expanded it to colleges in the Boston area, the Ivy League, and Stanford ' +
                        'University. It gradually added support for students at various other universities and later to high-school students.'
                },
                {
                    header: { 'text': 'WhatsApp' },
                    content: 'WhatsApp Messenger is a proprietary cross-platform instant messaging client for smartphones that operates ' +
                        'under a subscription business model. It uses the Internet to send text messages, images, video, user location and ' +
                        'audio media messages to other users using standard cellular mobile numbers. As of February 2016, WhatsApp had a user ' +
                        'base of up to one billion,[10] making it the most globally popular messaging application. WhatsApp Inc., based in ' +
                        'Mountain View, California, was acquired by Facebook Inc. on February 19, 2014, for approximately US$19.3 billion.'
                }
            ]
        });
        //Render initialized Tab component
        tabObj.appendTo('#tabComponent');
    }

    if ($("#scheduleComponent").length) {
        var scheduleObj = new ej.schedule.Schedule({
            height: '550px',
            selectedDate: new Date(2018, 1, 15),
            eventSettings: { dataSource: ej.base.extend([], window.scheduleData, null, true) }
        });
        scheduleObj.appendTo('#scheduleComponent');
    }

    if ($("#cb-componentchecked").length) {
        var checkBoxObj = new ej.buttons.CheckBox({ label: 'CheckBox', checked: true, });
        checkBoxObj.appendTo('#cb-componentchecked');
    }

    if ($("#cb-componentunchecked").length) {
        checkBoxObj = new ej.buttons.CheckBox({ label: 'Unchecked', checked: false, disabled: true });
        checkBoxObj.appendTo('#cb-componentunchecked');
    }

    if ($("#cb-componentintermediate").length) {
        checkBoxObj = new ej.buttons.CheckBox({ label: 'Indeterminate', indeterminate: true, disabled: true });
        checkBoxObj.appendTo('#cb-componentintermediate');
    }

    // function to handle the CheckBox change event
    function onChange(args) {
        this.label = 'CheckBox: ' + args.checked;
    }


    if ($("#componentradio1").length) {
        var radioButton = new ej.buttons.RadioButton({ label: 'Credit/Debit Card', name: 'payment', value: 'credit/debit', checked: true });
        radioButton.appendTo('#componentradio1');
    }

    if ($("#componentradio2").length) {
        radioButton = new ej.buttons.RadioButton({ label: 'Net Banking', name: 'payment', value: 'netbanking' });
        radioButton.appendTo('#componentradio2');
    }

    if ($("#componentradio3").length) {
        radioButton = new ej.buttons.RadioButton({ label: 'Cash on Delivery', name: 'payment', value: 'cashondelivery' });
        radioButton.appendTo('#componentradio3');
    }

    if ($("#toolbar_default").length) {
        var toolbarObj = new ej.navigations.Toolbar({
            items: [
                {
                    prefixIcon: 'e-cut-icon tb-icons', tooltipText: 'Cut'
                },
                {
                    prefixIcon: 'e-copy-icon tb-icons', tooltipText: 'Copy'
                },
                {
                    prefixIcon: 'e-paste-icon tb-icons', tooltipText: 'Paste'
                },
                {
                    type: 'Separator'
                },
                {
                    prefixIcon: 'e-bold-icon tb-icons', tooltipText: 'Bold'
                },
                {
                    prefixIcon: 'e-underline-icon tb-icons', tooltipText: 'Underline'
                },
                {
                    prefixIcon: 'e-italic-icon tb-icons', tooltipText: 'Italic'
                },
                {
                    prefixIcon: 'e-color-icon tb-icons', tooltipText: 'Color-Picker'
                },
                {
                    type: 'Separator'
                },
                {
                    prefixIcon: 'e-alignleft-icon tb-icons', tooltipText: 'Align-Left'
                },
                {
                    prefixIcon: 'e-alignright-icon tb-icons', tooltipText: 'Align-Right'
                },
                {
                    prefixIcon: 'e-aligncenter-icon tb-icons', tooltipText: 'Align-Center'
                },
                {
                    prefixIcon: 'e-alignjustify-icon tb-icons', tooltipText: 'Align-Justify'
                },
                {
                    type: 'Separator'
                },
                {
                    prefixIcon: 'e-bullets-icon tb-icons', tooltipText: 'Bullets'
                },
                {
                    prefixIcon: 'e-numbering-icon tb-icons', tooltipText: 'Numbering'
                },
                {
                    type: 'Separator'
                },
                {
                    prefixIcon: 'e-ascending-icon tb-icons', tooltipText: 'Sort A - Z'
                },
                {
                    prefixIcon: 'e-descending-icon tb-icons', tooltipText: 'Sort Z - A'
                },
                {
                    type: 'Separator'
                },
                {
                    prefixIcon: 'e-upload-icon tb-icons', tooltipText: 'Upload'
                },
                {
                    prefixIcon: 'e-download-icon tb-icons', tooltipText: 'Download'
                },
                {
                    type: 'Separator'
                },
                {
                    prefixIcon: 'e-indent-icon tb-icons', tooltipText: 'Text Indent'
                },
                {
                    prefixIcon: 'e-outdent-icon tb-icons', tooltipText: 'Text Outdent'
                },
                {
                    type: 'Separator'
                },
                {
                    prefixIcon: 'e-clear-icon tb-icons', tooltipText: 'Clear'
                },
                {
                    prefixIcon: 'e-reload-icon tb-icons', tooltipText: 'Reload'
                },
                {
                    prefixIcon: 'e-export-icon tb-icons', tooltipText: 'Export'
                },
                {
                    type: 'Separator'
                },
                {
                    prefixIcon: 'e-radar-icon tb-icons', tooltipText: 'Radar Chart'
                },
                {
                    prefixIcon: 'e-bubble-icon tb-icons', tooltipText: 'Bubble Chart'
                },
                {
                    prefixIcon: 'e-line-icon tb-icons', tooltipText: 'Line Chart'
                }
            ]

        });
        //Render initialized Toolbar component
        toolbarObj.appendTo('#toolbar_default');
    }
    if ($("#fileupload").length) {
        var dropElement = document.getElementById('upload-area');
        var preloadFiles = [
            { name: 'TypeScript Succintly', size: 12000, type: '.pdf' },
            { name: 'ASP.NET Webhooks', size: 500000, type: '.docx' },
        ];
        var uploadObj = new ej.inputs.Uploader({
            asyncSettings: {
                saveUrl: 'https://aspnetmvc.syncfusion.com/services/api/uploadbox/Save',
                removeUrl: 'https://aspnetmvc.syncfusion.com/services/api/uploadbox/Remove'
            },
            autoUpload: false,
            files: preloadFiles,
            removing: onRemove,
            success: onUploadSuccess,
            dropArea: dropElement
        });
        uploadObj.appendTo('#fileupload');
    }
    function onRemove(args) {
        var li = this.uploadWrapper.querySelector('[data-file-name="' + args.filesData[0].name + '"]');
        if (li.classList.contains('e-icon-spinner')) {
            return;
        }

    }
    function onUploadSuccess(args) {
        var _this = this;
        var li = this.uploadWrapper.querySelector('[data-file-name="' + args.file.name + '"]');
        if (args.operation === 'upload') {
            li.querySelector('.e-file-delete-btn').onclick = function () {

            };
            li.querySelector('.e-file-delete-btn').onkeydown = function (e) {
                if (e.keyCode === 13) {

                }
            };
        }
        else {
            ej.popups.hideSpinner(this.uploadWrapper);
            ej.base.detach(this.uploadWrapper.querySelector('.e-spinner-pane'));
        }
    }

    // context-menu coding
    if ($("#contextmenuComponent").length) {
        var menuItems = [
            {
                text: 'Cut',
                iconCss: 'e-cm-icons e-cut'
            },
            {
                text: 'Copy',
                iconCss: 'e-cm-icons e-copy'
            },
            {
                text: 'Paste',
                iconCss: 'e-cm-icons e-paste',
                items: [
                    {
                        text: 'Paste Text',
                        iconCss: 'e-cm-icons e-pastetext'
                    },
                    {
                        text: 'Paste Special',
                        iconCss: 'e-cm-icons e-pastespecial'
                    }
                ]
            },
            {
                separator: true
            },
            {
                text: 'Link',
                iconCss: 'e-cm-icons e-link'
            },
            {
                text: 'New Comment',
                iconCss: 'e-cm-icons e-comment'
            }
        ];

        //ContextMenu model definition
        var menuOptions = {
            target: '#contextmenuComponent',
            items: menuItems,
            // Event triggers while rendering each menu item where �Link� menu item is disabled
            beforeItemRender: function (args) {
                if (args.item.text === 'Link') {
                    args.element.classList.add('e-disabled');
                }
            }
        };

        var menuObj = new ej.navigations.ContextMenu(menuOptions, '#contextmenu');
        if (ej.base.Browser.isDevice) {
            ej.base.select('#contextmenuComponent').textContent = 'Touch hold to open the ContextMenu';
            menuObj.animationSettings.effect = 'ZoomIn';
        }
        else {
            ej.base.select('#contextmenuComponent').textContent = 'Right click/Touch hold to open the ContextMenu';
            menuObj.animationSettings.effect = 'SlideDown';
        }
    }
    //tool tip component render
    if ($("#component-tooltip").length) {
        //Initialize Button component
        var button = new ej.buttons.Button();

        //Render initialized Button component
        button.appendTo('#component-tooltip');

        //Initialize Tooltip component
        var tooltip = new ej.popups.Tooltip({

            //Set tooltip content
            content: 'Lets go green & Save Earth !!!'

        });

        //Render initialized Tooltip component
        tooltip.appendTo('#component-tooltip');
    }
    //tooltip for filter
    var next = new ej.popups.Tooltip({
        content: 'Filter'
    });

    next.appendTo('#filters');
    var next = new ej.popups.Tooltip({
        content: 'Import'
    });

    next.appendTo('#imports');
    //check box
    var next = new ej.popups.Tooltip({
        content: "If  include compatibility css option is checked, it will generate Compatibility  css files.  " +

            "Using these Compatibility theme files you can render both Essential JS 1 and Essential JS 2 components in a single page."
    });
    next.appendTo('#import');
    //render colorpicker components
    if ($("#component-color-picker").length) {
        var defaultObj = new ej.inputs.ColorPicker({}, '#component-color-picker');
    }

    //render switch components
    if ($("#switch-checked").length) {
        var switchObj = new ejs.buttons.Switch({ checked: true });
        switchObj.appendTo('#switch-checked');
    }
    if ($('#switch-unchecked').length) {
        switchObj = new ejs.buttons.Switch({});
        switchObj.appendTo('#switch-unchecked');
    }
    //render toast
    if ($('#component-toast').length) {
        let prevDuplicates = false;
        var toastObj = new ej.notifications.Toast({
            title: 'Anjolie Stokes',
            content: '<p><img src="http://npmci.syncfusion.com.s3-website.ap-south-1.amazonaws.com/production/documentation/samples/toast/actionBtn-cs1/laura.png"></p>',
            position: { X: "Center", Y: "Bottom" },
            width: 230,
            height: 250,
            maxcount: 1,
            target: '#element',
            buttons: [{
                model: { content: "Ignore" }, click: btnClick
            }, {
                model: { content: "reply" }
            }],
            beforeOpen: onBeforeOpen
        });

        //Render initialized Toast component
        toastObj.appendTo('#component-toast');

        ele = document.getElementById('toastBtnShow');

        ele.onclick = function () {


            toastObj.show();
        };

        function btnClick(e) {
            let toastEle = ej.base.closest(e.target, '.e-toast');
            toastObj.hide(toastEle);
        }
        function onBeforeOpen(e) {
            e.cancel = preventDuplicate(e);
        }
        function preventDuplicate(e) {
            let toastEle = e.element;
            let toasts = e.toastObj.element.children;
            for (let i = 0; i < toasts.length; i++) {
                if (toasts[i].querySelector('.e-toast-title').isEqualNode(toastEle.querySelector('.e-toast-title'))) {
                    return true;
                }
            }
            return false;
        }
    }
    if ($('#Component-rich-text-editor')) {
        var defaultRTE = new ej.richtexteditor.RichTextEditor({

            toolbarSettings: {
                items: ['Bold', 'Italic', 'Underline', 'StrikeThrough',
                    'FontName', 'FontSize', 'FontColor', 'BackgroundColor',
                    'LowerCase', 'UpperCase', '|',
                    'Formats', 'Alignments', 'OrderedList', 'UnorderedList',
                    'Outdent', 'Indent', '|',
                    'CreateLink', 'Image', '|', 'ClearFormat', 'Print',
                    'SourceCode', 'FullScreen', '|', 'Undo', 'Redo']
            }
        });
        defaultRTE.appendTo('#Component-rich-text-editor');
    }
    if ($("#spinleft").length) {
        var progressButton = new ej.splitbuttons.ProgressButton({
            content: 'Spin Left', isPrimary: true
        });
        progressButton.appendTo('#spinleft');
    }

    if ($("#spinright").length) {
        progressButton = new ej.splitbuttons.ProgressButton({
            content: 'Spin Right', spinSettings: { position: 'Right' }, isPrimary: true
        });
        progressButton.appendTo('#spinright');
    }
    if ($("#download").length) {
        progressButton = new ej.splitbuttons.ProgressButton({
            content: 'Download', duration: 4000, enableProgress: true,
            cssClass: 'e-hide-spinner e-progress-top', iconCss: 'e-btn-sb-icons e-download-icon'
        });
        progressButton.appendTo('#download');
    }
    if ($("#disabled").length) {
        progressButton = new ej.splitbuttons.ProgressButton({ content: 'Disabled', disabled: true });
        progressButton.appendTo('#disabled');
    }
    if ($('#MenuComponent')) {
        menuItems = [
            {
                text: 'File',
                iconCss: 'em-icons e-file',
                items: [
                    { text: 'Open', iconCss: 'em-icons e-open' },
                    { text: 'Save', iconCss: 'e-icons e-save' },
                    { separator: true },
                    { text: 'Exit' }
                ]
            },
            {
                text: 'Edit',
                iconCss: 'em-icons e-edit',
                items: [
                    { text: 'Cut', iconCss: 'em-icons e-cut' },
                    { text: 'Copy', iconCss: 'em-icons e-copy' },
                    { text: 'Paste', iconCss: 'em-icons e-paste' }
                ]
            },
            {
                text: 'View',
                items: [
                    {
                        text: 'Toolbars',
                        items: [
                            { text: 'Menu Bar' },
                            { text: 'Bookmarks Toolbar' },
                            { text: 'Customize' },
                        ]
                    },
                    {
                        text: 'Zoom',
                        items: [
                            { text: 'Zoom In' },
                            { text: 'Zoom Out' },
                            { text: 'Reset' },
                        ]
                    },
                    { text: 'Full Screen' }
                ]
            },
            {
                text: 'Tools',
                items: [
                    { text: 'Spelling & Grammar' },
                    { text: 'Customize' },
                    { separator: true },
                    { text: 'Options' }
                ]
            },
            {
                text: 'Help'
            }
        ];

        //Menu model definition 
        menuOptions = {
            items: menuItems
        };

        //Menu initialization
        menuObj = new ej.navigations.Menu(menuOptions, '#MenuComponent');
    }
    if ($('#Component-pivotview')) {
        var pivotGridObj = new ej.pivotview.PivotView({
            dataSource: {
                enableSorting: true,
                columns: [{ name: 'Year' }, { name: 'Quarter' }],
                valueSortSettings: { headerDelimiter: ' - ' },
                values: [{ name: 'Sold', caption: 'Units Sold' }, { name: 'Amount', caption: 'Sold Amount' }],
                data: getPivotData(),
                rows: [{ name: 'Country' }, { name: 'Products' }],
                formatSettings: [{ name: 'Amount', format: 'C0' }],
                expandAll: false,
                filters: []
            },
            width: '100%',
            height: 300,
            gridSettings: { columnWidth: 140 }
        });
        pivotGridObj.appendTo('#Component-pivotview');
        function getPivotData() {
            var pivotData = [
                { 'Sold': 25, 'Amount': 42600, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 27, 'Amount': 46008, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 49, 'Amount': 83496, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 31, 'Amount': 52824, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 51, 'Amount': 86904, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 90, 'Amount': 153360, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' },
                { 'Sold': 95, 'Amount': 161880, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 67, 'Amount': 114168, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 90, 'Amount': 153360, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 67, 'Amount': 114168, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 93, 'Amount': 139412, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 35, 'Amount': 52470, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 16, 'Amount': 27264, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 69, 'Amount': 117576, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 75, 'Amount': 127800, 'Country': 'France', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 20, 'Amount': 29985, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 83, 'Amount': 124422, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 16, 'Amount': 23989, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 28, 'Amount': 41977, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 48, 'Amount': 71957, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 57, 'Amount': 85448, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 25, 'Amount': 37480, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 69, 'Amount': 103436, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 36, 'Amount': 53969, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 75, 'Amount': 119662.5, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 28, 'Amount': 41977, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' },
                { 'Sold': 19, 'Amount': 28486, 'Country': 'France', 'Products': 'Road Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 91, 'Amount': 145190.5, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 24, 'Amount': 38292, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 94, 'Amount': 149977, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 100, 'Amount': 159550, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 30, 'Amount': 47865, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 89, 'Amount': 141999.5, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 25, 'Amount': 39887.5, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 42, 'Amount': 67011, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 21, 'Amount': 33505.5, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 74, 'Amount': 126096, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 76, 'Amount': 121258, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 69, 'Amount': 110089.5, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 16, 'Amount': 23989, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 52, 'Amount': 82966, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' },
                { 'Sold': 85, 'Amount': 144840, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 99, 'Amount': 148406, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 31, 'Amount': 49460.5, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 33, 'Amount': 52651.5, 'Country': 'France', 'Products': 'Touring Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 41, 'Amount': 61464, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 64, 'Amount': 102112, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 57, 'Amount': 97128, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 39, 'Amount': 66456, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 76, 'Amount': 129504, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 33, 'Amount': 56232, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 81, 'Amount': 138024, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 65, 'Amount': 110760, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 47, 'Amount': 70458, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 91, 'Amount': 155064, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 16, 'Amount': 27264, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 71, 'Amount': 120984, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 36, 'Amount': 61344, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' },
                { 'Sold': 39, 'Amount': 58466, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 59, 'Amount': 100536, 'Country': 'Germany', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 83, 'Amount': 124422, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 19, 'Amount': 28486, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 34, 'Amount': 50971, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 26, 'Amount': 38979, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 15, 'Amount': 22490, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 13, 'Amount': 20741.5, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 79, 'Amount': 118426, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 14, 'Amount': 20991, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' },
                { 'Sold': 34, 'Amount': 50971, 'Country': 'Germany', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 47, 'Amount': 74988.5, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 93, 'Amount': 148381.5, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 15, 'Amount': 23932.5, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 48, 'Amount': 76584, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 44, 'Amount': 70202, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 59, 'Amount': 94134.5, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 77, 'Amount': 131208, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 84, 'Amount': 143136, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 34, 'Amount': 54247, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 56, 'Amount': 95424, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 35, 'Amount': 55842.5, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 71, 'Amount': 113280.5, 'Country': 'Germany', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' },
                { 'Sold': 91, 'Amount': 155064, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 90, 'Amount': 153360, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 40, 'Amount': 68160, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' },
                { 'Sold': 24, 'Amount': 40896, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 31, 'Amount': 46474, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 92, 'Amount': 156768, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 14, 'Amount': 23856, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 95, 'Amount': 161880, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 51, 'Amount': 86904, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 39, 'Amount': 66456, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 36, 'Amount': 53969, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 86, 'Amount': 128919, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 40, 'Amount': 59965, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 96, 'Amount': 163584, 'Country': 'United Kingdom', 'Products': 'Mountain Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 24, 'Amount': 35981, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 97, 'Amount': 145408, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 69, 'Amount': 103436, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 95, 'Amount': 142410, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 30, 'Amount': 44975, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 11, 'Amount': 16494, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 95, 'Amount': 142410, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 11, 'Amount': 16494, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 27, 'Amount': 40478, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 68, 'Amount': 101937, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 100, 'Amount': 149905, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 45, 'Amount': 67460, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 16, 'Amount': 23989, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 40, 'Amount': 59965, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 18, 'Amount': 26987, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 70, 'Amount': 104935, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' },
                { 'Sold': 43, 'Amount': 73272, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 43, 'Amount': 73272, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 83, 'Amount': 124422, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 52, 'Amount': 88608, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 91, 'Amount': 155064, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 100, 'Amount': 149905, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 70, 'Amount': 104935, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 37, 'Amount': 63048, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 41, 'Amount': 69864, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 99, 'Amount': 148406, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 67, 'Amount': 114168, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 41, 'Amount': 65415.5, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 81, 'Amount': 121424, 'Country': 'United States', 'Products': 'Road Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' },
                { 'Sold': 20, 'Amount': 29985, 'Country': 'United Kingdom', 'Products': 'Road Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 85, 'Amount': 144840, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 49, 'Amount': 83496, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 23, 'Amount': 39192, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 34, 'Amount': 54247, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 53, 'Amount': 90312, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 82, 'Amount': 130831, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q1' },
                { 'Sold': 60, 'Amount': 95730, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 71, 'Amount': 113280.5, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q2' },
                { 'Sold': 25, 'Amount': 42600, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 28, 'Amount': 47712, 'Country': 'United States', 'Products': 'Mountain Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' },
                { 'Sold': 21, 'Amount': 33505.5, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 94, 'Amount': 149977, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q4' },
                { 'Sold': 45, 'Amount': 71797.5, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2015', 'Quarter': 'Q3' },
                { 'Sold': 75, 'Amount': 119662.5, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 49, 'Amount': 78179.5, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 50, 'Amount': 79775, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q2' },
                { 'Sold': 56, 'Amount': 89348, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 40, 'Amount': 63820, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q3' },
                { 'Sold': 14, 'Amount': 22337, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 76, 'Amount': 121258, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q1' },
                { 'Sold': 75, 'Amount': 119662.5, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 11, 'Amount': 17550.5, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q2' },
                { 'Sold': 94, 'Amount': 149977, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 80, 'Amount': 127640, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 54, 'Amount': 86157, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 14, 'Amount': 22337, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q3' },
                { 'Sold': 17, 'Amount': 27123.5, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2016', 'Quarter': 'Q4' },
                { 'Sold': 45, 'Amount': 71797.5, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q1' },
                { 'Sold': 76, 'Amount': 121258, 'Country': 'United States', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' },
                { 'Sold': 45, 'Amount': 71797.5, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2018', 'Quarter': 'Q1' },
                { 'Sold': 11, 'Amount': 17550.5, 'Country': 'United Kingdom', 'Products': 'Touring Bikes', 'Year': 'FY 2017', 'Quarter': 'Q4' }];

            return pivotData;
        }
    }
    if ($('#Component-treegrid')) {
        var treeGridObj = new ej.treegrid.TreeGrid({
            dataSource: window.TreegridData,
            childMapping: 'subtasks',
            treeColumnIndex: 1,
            height: 380,
            columns: [
                { field: 'taskID', headerText: 'Task ID', width: 80, textAlign: 'Right' },
                { field: 'taskName', headerText: 'Task Name', width: 200, textAlign: 'Left' },
                { field: 'startDate', headerText: 'Start Date', width: 90, textAlign: 'Right', type: 'date', format: 'yMd' },
                { field: 'endDate', headerText: 'End Date', width: 90, textAlign: 'Right', type: 'date', format: 'yMd' },
                { field: 'duration', headerText: 'Duration', width: 90, textAlign: 'Right' },
                { field: 'progress', headerText: 'Progress', width: 90, textAlign: 'Right' },
            ]
        });
        treeGridObj.appendTo('#Component-treegrid');
    }
    if ($('#component-inplace-editor')) {
        var editObj = new ej.inplaceeditor.InPlaceEditor({
            mode: 'Inline',
            type: 'Text',
            value: 'Andrew',
            submitOnEnter: true,
            model: {
                placeholder: 'Enter employee name'
            }
        });
        editObj.appendTo('#component-inplace-editor');
    }
    if ($('#Component-splitter')) {
        var splitObj1 = new ej.layouts.Splitter({
            height: '110px',
            paneSettings: [
                { size: '25%', min: '60px' },
                { size: '50%', min: '60px' },
                { size: '25%', min: '60px' }
            ],
            width: '100%',
            separatorSize: 4
        });
        splitObj1.appendTo('#Component-splitter');
    }

    if (!window.mainSplitter && $('#Main-splitter')) {
        window.mainSplitter = splitObj1 = new ej.layouts.Splitter({
            enablePersistence: true,
            updatePrePaneInPercentage: true,
            height: '95vh',
            paneSettings: [
                { size: '70%', min: '500px' },
                { size: '30%', min: '450px' },
            ],
            width: '100%',
            separatorSize: 4
        });
        window.mainSplitter.appendTo('#Main-splitter');
    }

    if ($('#Component-pdf-viewer')) {
        var viewer = new ej.pdfviewer.PdfViewer({
            documentPath: "PDF_Succinctly.pdf",
            serviceUrl: 'https://ej2services.syncfusion.com/production/web-services/api/pdfviewer'
        });
        ej.pdfviewer.PdfViewer.Inject(ej.pdfviewer.TextSelection, ej.pdfviewer.TextSearch, ej.pdfviewer.Print, ej.pdfviewer.Navigation);
        viewer.appendTo('#Component-pdf-viewer');
    }
    if ($('#Component-query-builder')) {
        var columnData = [
            { field: 'EmployeeID', label: 'Employee ID', type: 'number' },
            { field: 'FirstName', label: 'First Name', type: 'string' },
            { field: 'TitleOfCourtesy', label: 'Title Of Courtesy', type: 'boolean', values: ['Mr.', 'Mrs.'] },
            { field: 'Title', label: 'Title', type: 'string' },
            { field: 'HireDate', label: 'Hire Date', type: 'date', format: 'dd/MM/yyyy' },
            { field: 'Country', label: 'Country', type: 'string' },
            { field: 'City', label: 'City', type: 'string' }
        ];
        var importRules = {
            'condition': 'and',
            'rules': [{
                'label': 'Employee ID',
                'field': 'EmployeeID',
                'type': 'number',
                'operator': 'equal',
                'value': 1
            },
            {
                'label': 'Title',
                'field': 'Title',
                'type': 'string',
                'operator': 'equal',
                'value': 'Sales Manager'
            }
            ]
        };
        var qryBldrObj = new ej.querybuilder.QueryBuilder({
            width: '100%',
            dataSource: window.querybuilderemployeeData,
            columns: columnData,
            rule: importRules,
        });
        qryBldrObj.appendTo('#Component-query-builder');

    }
    if ($('#Component-chips')) {
        new ej.buttons.ChipList({ chips: window.chipsData.defaultData }, '#Component-chips');
    }

    if ($('#component-list-box')) {
        var listBoxObj = new ej.dropdowns.ListBox({
            // Set the dataSource property.
            dataSource: window.info,

            fields: { text: 'text', value: 'id' },
            // Set the selection settings with type as `CheckBox`.

            selectionSettings: { type: 'CheckBox' }

        });

        listBoxObj.appendTo('#component-list-box');
    }
    if ($('#Component-file-manager')) {
        var hostUrl = 'https://ej2services.syncfusion.com/production/web-services/';
        var fileObject = new ej.filemanager.FileManager({
            ajaxSettings: {
                url: hostUrl + 'api/FileManager/FileOperations',
                getImageUrl: hostUrl + 'api/FileManager/GetImage',
                uploadUrl: hostUrl + 'api/FileManager/Upload',
                downloadUrl: hostUrl + 'api/FileManager/Download'
            },
            view: 'Details'
        });


        fileObject.appendTo('#Component-file-manager');
    }
    if ($('#Component-gantt')) {
        var ganttChart = new ej.gantt.Gantt({
            dataSource: projectNewData,
            height: '450px',
            highlightWeekends: true,
            taskFields: {
                id: 'TaskID',
                name: 'TaskName',
                startDate: 'StartDate',
                endDate: 'EndDate',
                duration: 'Duration',
                progress: 'Progress',
                dependency: 'Predecessor',
                child: 'subtasks'
            },
            eventMarkers: [
                {
                    day: new Date('04/09/2019'),
                    label: 'Research phase'
                }, {
                    day: new Date('04/30/2019'),
                    label: 'Design phase'
                }, {
                    day: new Date('05/23/2019'),
                    label: 'Production phase'
                }, {
                    day: new Date('06/20/2019'),
                    label: 'Sales and marketing phase'
                }
            ],
            labelSettings: {
                leftLabel: 'TaskName'
            },
        });
        ganttChart.appendTo('#Component-gantt');
    }
}

function overlay(IsThemeSwitch) {
    if (IsThemeSwitch) {
        ej.base.select('.cont-container').classList.add('theme-hide');
        ej.base.select('.rightpanel').classList.add('theme-hide');
    }

    themeBodyLeftOverlay.classList.remove('theme-hide');
    ej.base.select('.cont-container').classList.add('.click-events');
}

function removeOverlay(IsThemeSwitch) {
    if (!themeBodyLeftOverlay.classList.contains('theme-hide')) {
        if (IsThemeSwitch) {
            ej.base.select('.cont-container').classList.remove('theme-hide');
            ej.base.select('.rightpanel').classList.remove('theme-hide');
        }
        themeBodyLeftOverlay.classList.add('theme-hide');
        ej.base.select('.cont-container').classList.remove('.click-events');
    }
}


function getUrlParams(url) {
    try {
        return JSON.parse('{"' + decodeURI(url ? url.match(/(?:[^?]*)\??([^#]*)/)[1] : window.location.search.substring(1)).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}');
    } catch (error) { return {}; }
}

function renderDialogs() {
    // rendering filter dialog
    $('.theme-filter-header').hide();
    var template = ej.base.select('#filter-content-template');
    var confirmContent = template.innerHTML;
    template.parentElement.removeChild(template);
    filterDialog = new ej.popups.Dialog({
        visible: false,
        content: `<div id ="filter-dialogs">
                    <div class = "filter-header">
                        <span class = "header-content" > Filter </span>
                         <div class="filter-dialog-close" onclick="filtering(false)"><span class="e-icons close-icon "></span></div>
                    </div>`+ confirmContent + `</div>
                         <div id = "filter-buttons">   
                             <button type="button" class="btn btn-primary" id = "Apply" onclick="filtering(true)">APPLY</button>
                              <button type="button" class="btn btn-default" id="cancel-filter" onclick="filtering(false)">CANCEL</button>
                            </div>`,
        modal: true,

        width: '50%',
        target: document.body,
        isModal: true,
        animationSettings: {
            effect: 'None'
        }
    });
    filterDialog.appendTo('#filterDialog');

    // rendering create dialog    

    createDialog = new ej.popups.Dialog({
        visible: false,
        modal: true,
        content: `<div id="create-dialog">
                    <div class="headers dlg-header-h">
                        <span class="header-content"> Create new Theme based from ${getUrlParams().theme}</span>
                         <div class="filter-dialog-close" onclick="createDialog.hide()"><span class="e-icons close-icon "></span></div>
                    </div>
                    <div class="form-group">
                     <label for="input-name" id="input-name-label">Name</label>
                     <input onkeyup="updateCreateButtonState(this)" class="form-control form-control-sm" id="input-name" type="text" >
                        <br/>
   
                   </div>
                 <div class="right-buttons">                     
                     <button type="button" id="create-newtheme-btn" class="btn btn-primary disabled" onclick="createNewTheme(document.getElementById('input-name').value)">Create</button>
                     <button type="button" class="btn btn-default" onclick="createDialog.hide()">CANCEL</button>
               <div>`,
        width: '330px',
        isModal: true,

        target: document.body,
        animationSettings: { effect: 'None' }
    });
    createDialog.appendTo('#create-dialog');

    // rendering login dialog
    loginDialog = new ej.popups.Dialog({
        visible: false,
        modal: true,
        content: `<div id="login-dialog">
                    <div class="headers">
                        <span class="header-content"> Login </span>
                         <div class="filter-dialog-close" onclick="loginDialog.hide()"><span class="e-icons close-icon "></span></div>
                    </div>
                    <div class="form-group">
                     <label for="input-user" id="input-user-label">User</label>
                     <input class="form-control form-control-sm" id="input-user" type="text" onkeydown="login()" >
                        <br/>
                     <label for="input-password" id="input-password-label">Password</label>
                     <input class="form-control form-control-sm" id="input-password" type="password" onkeydown="login()" >
                   </div>
                 <div class="right-buttons">
                     <span class="dialog-error-msg" id="error-message"></span>
                     <button type="button" class="btn btn-primary" onclick="login()">LOGIN</button>
                     <button type="button" class="btn btn-default" onclick="loginDialog.hide()">CANCEL</button>
               <div>`,
        width: '330px',
        isModal: true,

        target: document.body,
        animationSettings: { effect: 'None' }
    });
    loginDialog.appendTo('#login-dialog');



    // rendering export dialog
    exportDialog = new ej.popups.Dialog({
        visible: false,
        modal: true,
        content: `<div id ="export-dialogs">
                    <div class = "headers">
                        <span class = "header-content" > Download </span>
                         <div class="filter-dialog-close" onclick="exporting(false)"><span class="e-icons close-icon "></span></div>
                    </div>
                   <div class="form-group">
                     <label for="inputdefault" id="input-font">File Name</label>
                     <input class="form-control form-control-sm" id="inputdefault" type="text" > 
                   </div>
                  <div class="download-options" style="display:none" id="downloads-info">
                    <div class="include-css">
                        <input id="ts-checkbox" type="checkbox" value="compatibility">
                         
                    </div>
                    <div class="comp-info"id = "import">
                       <span class="e-icons sb-compatable-info sb-icons" ></span>
                    </div>
                  </div>
                 </div>
                 <div id = "export-buttons">
                     <button type="button" class="btn btn-primary" id = "Download" onclick="exporting(true)">DOWNLOAD</button>
                     <button type="button" class="btn btn-default" id ="export-cancel" onclick="exporting(false)">CANCEL</button>
               <div>`,
        width: '330px',
        isModal: true,

        target: document.body,
        animationSettings: { effect: 'None' }
    });
    exportDialog.appendTo('#export-dialog');
    document.getElementById("inputdefault").value = curTheme;

    //render import dialog 
    importDlg = new ej.popups.Dialog({

        visible: false,
        width: '300px',
        target: document.body,
        modal: true,
        isModal: true,
        animationSettings: {
            effect: 'None'
        }
    });
    importDlg.appendTo('#import-dialog');
    document.getElementById('imports').onclick = function () {
        document.getElementById('imports').classList.add('actives');
        document.getElementById('contents').style.display = '';
        document.getElementById("import-Download").disabled = true;
        importDlg.show();
    };
    ej.base.L10n.load({
        'en-US': {
            'uploader': {
                dropFilesHint: 'Select theme file'
            }
        }
    })
    var uploadObjs = new ej.inputs.Uploader({
        asyncSettings: {
            saveUrl: 'https://aspnetmvc.syncfusion.com/services/api/uploadbox/Save',
            removeUrl: 'https://aspnetmvc.syncfusion.com/services/api/uploadbox/Remove'
        },
        allowedExtensions: '.json',
        removing: onRemove,
        success: onUploadSuccess,
        dropArea: document.getElementById('dropArea'),
        locale: 'en-US'

    });
    function onRemove(args) {
        var li = this.uploadWrapper.querySelector('[data-file-name="' + args.filesData[0].name + '"]');
        if (li.classList.contains('e-icon-spinner')) {
            return;
        }
        document.getElementById("import-Download").disabled = true;

    }
    function onUploadSuccess(args) {
        var _this = this;
        var li = this.uploadWrapper.querySelector('[data-file-name="' + args.file.name + '"]');
        if (args.operation === 'upload') {
            li.querySelector('.e-file-delete-btn').onclick = function () {

            };
            li.querySelector('.e-file-delete-btn').onkeydown = function (e) {
                if (e.keyCode === 13) {

                }
            };
            document.getElementById("import-Download").disabled = false;
        }
        else {
            ej.popups.hideSpinner(this.uploadWrapper);
            ej.base.detach(this.uploadWrapper.querySelector('.e-spinner-pane'));
        }

    }


    uploadObjs.appendTo('#fileuploads');

}

function checkApply() {
    var element = document.getElementById('apply-controls');
    if (element) {
        element.style.display = 'block';
    }
}

function applyChanges() {
    var theme = change(curTheme || getUrlParams().theme);
    var ajax = new ej.base.Ajax({
        type: "POST",
        url: "/Home/ApplyChanges",
        contentType: 'application/json; charset=utf-8',
        processData: false,
        data: JSON.stringify(theme)
    }, 'POST', true);
    ajax.send();
    ajax.onSuccess = function (url) {
        window.location.href = url;
    };
}

function deleteCurrentTheme(force) {
    force = force || confirm('Are you sure you want to delete the theme "' + curTheme + '"');
    if (force && curTheme) {
        var ajax = new ej.base.Ajax({
            type: "POST",
            url: "/Home/DeleteTheme",
            contentType: 'application/json; charset=utf-8',
            processData: false,
            data: JSON.stringify(curTheme)
        }, 'POST', true);
        ajax.send();
        ajax.onSuccess = function (url) {
            window.location.href = url;
        };
    }
}

function getAvailableThemes() {
    return Array.from(document.querySelector('#themelist').querySelectorAll('li')).map(l => l.innerText.trim());
}

function updateCreateButtonState(input) {
    var btn = document.getElementById('create-newtheme-btn')
    btn.classList[canCreateNewTheme(input.value) ? 'remove' : 'add']('disabled');
}
function canCreateNewTheme(newThemeName) {
    return newThemeName && !getAvailableThemes().includes(newThemeName);
}

function createNewTheme(newThemeName) {
    if (canCreateNewTheme(newThemeName)) {
        var baseTheme = curTheme || getUrlParams().theme,
            theme = change(baseTheme);
        theme.theme = newThemeName;

        var ajax = new ej.base.Ajax({
            type: "POST",
            url: "/Home/CreateNewTheme",
            contentType: 'application/json; charset=utf-8',
            processData: false,
            data: JSON.stringify({ properties: theme, baseTheme: baseTheme })
        }, 'POST', true);
        ajax.send();
        ajax.onSuccess = function (url) {
            window.location.href = url;
        };

    }
}

function currentComponents() {
    var components = [];
    componentsId = [];
    var checked = ej.base.selectAll('.theme-filter-body input:checked');
    for (var comp of checked) {
        if (comp.id.indexOf('cat') == -1) {
            var compName = comp.id;
            componentsId.push(compName);
            compName = compName.replace("comp-", "");
            compName = compName === 'textbox' ? 'input' : compName;
            components.push(compName);
        }


    }
    return components;
}

function exporting(boolean) {
    if (boolean) {
        var components = currentComponents();
        var compatibility = document.getElementById("ts-checkbox").checked; // check compatibility css required or not
        var fileElement = document.getElementById("inputdefault");
        var filename = fileElement.value;
        getdependency(components);


        if (colorchange) {
            colorchange['theme'] = window.themes;
            var themes_var;
            if (window.themes.indexOf('-') !== 1) {

                themes_var = window.themes.replace("-", "");

                themes_var = themes_var.trim();
            } else {
                themes_var = window.themes;
            }
            colorchange['file'] = filename;
            colorchange.properties = themeColors[themes_var];
            colorchange['components'] = componentsId;
            colorchange['compatibility'] = compatibility;
        }
        colorchange["dependency"] = window.dependency_arr;
        themeBodyLeftOverlay.style.backgroundColor = "#383838";
        overlay(false);

        var url = "/Home/Export";
        if (varTypeFilter && varTypeFilter.length) {
            url += '?varTypes=' + varTypeFilter.join(',');
        }

        var ajax = new ej.base.Ajax({
            type: "POST",
            url: url,
            contentType: 'application/json; charset=utf-8',
            processData: false,
            data: JSON.stringify(colorchange) // Note it is important
        }, 'POST', true);
        ajax.send();
        ajax.onSuccess = function (data) {
            var download = ej.base.select('#downloadlink');
            download.href = data;
            download.click();
            removeOverlay(false);
            themeBodyLeftOverlay.style.backgroundColor = "transparent";

        };

    }
    exportDialog.hide();
}

function renderProperties(themeName, force) {
    loadThemeProperties(themeName, function () {
        _renderProperties(themeName);
    }, force);
}

function login() {
    if (loginDialog?.visible) {
        if (!event || !event.key || event.key === 'Enter') {
            document.getElementById('error-message').innerText = '';
            var ajax = new ej.base.Ajax({
                type: "POST",
                url: "/Account/Login",
                contentType: 'application/json; charset=utf-8',
                processData: false,
                data: JSON.stringify({ UserName: document.getElementById('input-user').value, Password: document.getElementById('input-password').value })
            }, 'POST', true);
            ajax.send();
            ajax.onFailure = function (e) {
                document.getElementById('error-message').innerText = 'Invalid user or Password';
            };
            ajax.onSuccess = function (data) {
                if (JSON.parse(data)) {
                    loginDialog.hide();
                    window.location.reload();
                } else {
                    document.getElementById('error-message').innerText = 'Invalid user or Password'
                }
            };
        }
    }
}

function toolTipForProperty(property, key) {
    return `
${key || ''} \r
Id: ${property.id} \r
Value: ${property.default} \r
Component: ${property.component} \r
`;
}

function _editorFor(themeName, property, key) {

    var wrapper = new ej.base.createElement('div', { className: 'theme-prop-wrapper', attrs: { 'data-id': property.id, 'data-property-type': property.type } });
    var labelElement = new ej.base.createElement('div', { className: 'f-left theme-property', innerHTML: `<label title="${toolTipForProperty(property, key)}" for="property-value-edit-${property.id}">${key}</label>` });
    var editCtrl = new ej.base.createElement('div', { className: 'f-right theme-value', innerHTML: _inputFor(property) });
    editCtrl.querySelector('input').onchange = function (evt) {
        onPropertyValueChange(themeName, property, this.value, this);
    };

    if (property.type === ScssVariableType.Color && !useNativeColorCtrl) { // prepare Syncfusion ColorPicker 
        var extraClass = ColorHelper.isTransparent(property.default) ? 'transparent-colorpalette' : (ColorHelper.isNone(property.default) ? 'none-colorpalette' : '');
        editCtrl.insertAdjacentHTML('beforeend', `<input type="button" class="right-prop-btn ${extraClass} color-picker ${property.id}" />`); // ColorPicker button
        if (virtualizeThemeProperties) {
            var btn = editCtrl.querySelector('input[type=button]');
            btn.style.backgroundColor = property.default;
            btn.title = toolTipForProperty(property, key);
            btn.onclick = function (e) {
                btn.onclick = () => { };
                ColorHelper.createNewColorPicker(property, '.color-picker.' + property.id, editCtrl, function (propertyId, value) {
                    var input = getRenderedInputFor(propertyId);
                    input.value = value;
                    input.dispatchEvent(new Event('change'));
                });
                ColorHelper.applyColorPickerStyles();
                setTimeout(() => { // Hack to open newly created picker
                    var x = btn.parentElement.querySelector('.theme-color');
                    x.click(e);
                }, 100);
            };
        }
    }

    var createdInput = editCtrl.querySelector('input');
    if (createdInput?.getAttribute('data-type')) {
        editCtrl.insertAdjacentHTML('beforeend', `<input type="button" title="Toggle plain input" class="right-prop-btn toggle-input-mode-btn ${property.id}" />`);
        editCtrl.querySelector('input[type=button]').onclick = function () {
            toggleInputType(createdInput);
        };
    }

    // Empty right button only to align everything correct
    if (!editCtrl.querySelector('.right-prop-btn') && !editCtrl.querySelector('.color-picker')) {
        editCtrl.insertAdjacentHTML('beforeend', `<input type="button" title="Toggle plain input" class="right-prop-btn empty ${property.id}" />`);
    }

    wrapper.appendChild(labelElement);
    wrapper.appendChild(editCtrl);

    return wrapper;
}

function toggleInputType(inputCtrl) {
    var type = inputCtrl.getAttribute('data-type');
    if (type) {
        inputCtrl.setAttribute('data-type', inputCtrl.type);
        inputCtrl.type = type;
    }
}

function getRenderedInputFor(propertyId) {
    return document.getElementById(`property-value-edit-${propertyId}`);
}

function _inputFor(property) {
    var inputId = `property-value-edit-${property.id}`;

    var type = 'type="text"';
    if (property.type === ScssVariableType.Color && useNativeColorCtrl) {
        if (ColorHelper.isTransparentOrNone(property.default)) {
            type = 'type="text" data-type="color"';
        } else {
            type = 'type="color" data-type="text"';
        }
    }
    return `<input title="${toolTipForProperty(property)}" list="preset-${property.id}" value="${property.default}" ${type} id="${inputId}" class="property-edit-input-${property.id} property-edit-input" /> <datalist id="preset-${property.id}"> ${property.palettes.map(c => '<option>' + c + '</option>').join('')} </datalist> `;
}

function onPropertyValueChange(themeName, property, value, sender) {
    // force = force || confirm('Are you sure you want to delete the theme "' + curTheme + '"');
    // TODO: Check property value valid for type

    if (virtualizeThemeProperties) { // If we virtualize rendering we need to update default value as well
        property.default = value;
    }

    var colorEle = sender.parentElement.querySelector('.theme-color');
    var colorchange = change(themeName, property.id, value);
    var controlSection = document.getElementById('control-section');
    var scrollTop = controlSection.scrollTop;
    var darkOrLight = themeName.indexOf('dark') >= 0 || themeName.indexOf('light') >= 0;

    themeBodyLeftOverlay.style.backgroundColor = "#383838";
    overlay(false);

    if (darkOrLight) {
        window.dependency_arr.push("layouts/card");
        colorchange["dependency"] = window.dependency_arr;
        colorchange.theme = colorchange.theme.replace('light', '');
    }
    var ajax = new ej.base.Ajax({
        type: "POST",
        url: !darkOrLight ? "/Home/ThemeChange" : "/Home/DarkThemeChange",
        contentType: 'application/json; charset=utf-8',
        processData: false,
        data: JSON.stringify(colorchange)
    }, 'POST', true);
    ajax.send();
    ajax.onSuccess = function (data) {
        applyCustomThemePreview(data);
        ColorHelper.setTransparentClsOrBgValue(value, colorEle);
        removeOverlay(false);
        themeBodyLeftOverlay.style.backgroundColor = "transparent";
        controlSection.scrollTop = scrollTop;
    };

    checkApply();
}

function varCount(visible) {
    document.getElementById('var-count').style.opacity = visible ? '1' : '0';
}

function isInComponentFilter(themeProperty, components) {
    if (!themeProperty || !themeProperty.component) {
        return false;
    }
    var component = themeProperty.component.toLowerCase();
    components = components || currentComponents();
    return !isfilterapplied || component === 'base' || components.includes(component);
}

// Rendering theme properties elements
function _renderProperties(themeName) {
    lastRenderedTheme = themeName;
    ej.base.enableRipple(false);
    if (themeName.indexOf('-') !== -1) {
        themeName = themeName.replace('-', "");
        themeName = themeName.trim();
    }
    var properties = window.themeProps[themeName];

    if (properties !== undefined) {
        var keys = Object.keys(properties),
            search = document.getElementById('filter-input').value || '';
        document.getElementById('theme-properties').innerHTML = "";
        if (virtualizeThemeProperties) {
            var components = currentComponents();
            keys = keys.filter(k => (k.toLowerCase().includes(search.toLowerCase()) || _match(search, properties[k])) && isInComponentFilter(properties[k], components));

            document.getElementById('var-count').innerHTML = `${keys.length} Variables`;
            var list = new VirtualList({
                w: '100%',
                h: 900,
                id: 'virtual-theme-properties',
                itemHeight: 45,
                totalRows: keys.length,
                generatorFn: function (i) {
                    //document.getElementById('filter-input').value                
                    var property = properties[keys[i]];
                    var inputWrapper = _editorFor(themeName, property, keys[i]);

                    return inputWrapper;
                }
            });

            list.container.style.marginLeft = "auto";
            list.container.style.marginRight = "auto";
            document.getElementById("theme-properties").appendChild(list.container);
            setTimeout(() => { document.getElementById('virtual-theme-properties').style.height = '98%'; }, 500); // Need to do this afterwards, otherwise layout crash.. no idea currently
        } else {
            document.getElementById('var-count').innerHTML = `${keys.length} Variables`;
            for (var i = 0; i < keys.length; i++) {
                if (keys[i].startsWith('_')) {
                    continue;
                }
                var property = properties[keys[i]];
                var inputWrapper = document.getElementById('theme-properties').appendChild(_editorFor(themeName, property, keys[i]));

                ColorHelper.createNewColorPicker(property, '.color-picker.' + property.id, inputWrapper, function (propertyId, value) {
                    var input = getRenderedInputFor(propertyId);
                    input.value = value;
                    input.dispatchEvent(new Event('change'));
                });
            }
            ColorHelper.applyColorPickerStyles();
        }

        if (themeName === 'material' || themeName === 'materialdark') {
            ej.base.enableRipple(true);
        }
    }
}

/* change the color values */
function change(theme, property, color) {
    var colorObj = {};
    colorObj.properties = themeColors[theme];
    if (property && color) {
        colorObj.properties['$' + property] = color;
    }
    if (theme.indexOf('dark') !== -1) {
        theme = theme.replace('dark', '-dark');
        theme = theme.trim();
        colorObj['theme'] = theme;
    } else {
        colorObj['theme'] = theme;
    }

    return colorObj;
}

/* load theme */
function loadTheme(theme, isOverylay) {
    if (isOverylay) {
        overlay(true);
    }

    Array.from(document.body.classList).filter(s => s.startsWith('themestudio-')).forEach(function (t) {
        document.body.classList.remove(t);
    });

    document.body.classList.add('themestudio-' + theme);

    document.getElementById("inputdefault").value = theme;

    if (!theme.includes('-dark')) {
        colorpicker();
        loadDefaultThemes(theme, true);
    }
    else {
        setTimeout(function () {
            colorpicker();
            var components = [];
            componentsId = [];
            var checked = ej.base.selectAll('.theme-filter-body input:checked');
            for (var comp of checked) {
                if (comp.id.indexOf('cat') == -1) {
                    var compName = comp.id;
                    componentsId.push(compName);
                    compName = compName.replace("comp-", "");
                    compName = compName === 'textbox' ? 'input' : compName;
                    components.push(compName);
                }


            }
            getdependency(components);
            document.getElementById("dark").ej2_instances[0].checked = true;
            loadDefaultThemes1(theme, true);
        }, 500);


    }

}

function destroyControls() {
    var elementlist = ej.base.selectAll('.e-control', document.getElementById('control-section'));
    for (var i = 0; i < elementlist.length; i++) {
        var control = elementlist[i];
        if (control.ej2_instances) {
            for (var a = 0; a < control.ej2_instances.length; a++) {
                var instance = control.ej2_instances[a];
                if (!instance.isDestroyed)
                    instance.destroy();
            }
        }
    }
}

//Filtering Script Start
var checkBoxObj = new ej.buttons.CheckBox({
    label: 'Include compatibility css'
});
checkBoxObj.appendTo('#ts-checkbox');

document.getElementById('filters').onclick = function () {
    document.getElementById('filters').classList.add('actives');
    filterDialog.show();
};
document.getElementById('download-now').onclick = function () {
    exportDialog.show();
    document.getElementById('downloads-info').style.display = '';
};

var loginBtnEl = document.getElementById('login-now');
if (loginBtnEl) {
    loginBtnEl.onclick = function () {
        loginDialog.show();
    };
}

var selectAll = new ej.buttons.CheckBox({
    label: 'Select all',
    checked: false,
    change: selectAllState
});
selectAll.appendTo('#filter-selectall');

var catchbxs = ej.base.selectAll('.theme-filter-body .cat-chbx input');
var compchbxs = ej.base.selectAll('.theme-filter-body .comp-chbx input');

var qsData = [];
var fsData = {
    comps: [],
    compCat: {}
};

for (var catDiv of catchbxs) {
    qsData.push({
        name: catDiv.getAttribute('value'),
        code: catDiv.id
    });
    for (var compcb of ej.base.selectAll('[data="' + catDiv.id + '"] input')) {
        fsData.comps.push({
            name: compcb.value
        });
        fsData.compCat[compcb.value] = catDiv.id;
    }
}

var selectAllDiv = ej.base.select('.theme-filter-selectall');
var fsDmData = new ej.data.DataManager(fsData.comps);

for (var catchbx of catchbxs) {
    createCheckBox(catchbx, true);
}

for (var compchbx of compchbxs) {
    createCheckBox(compchbx, false);
}

function createCheckBox(elem, catComp) {
    var checkbox = new ej.buttons.CheckBox({
        label: elem.value,
        checked: false,
        change: catComp ? catCheck : compCheck
    });
    checkbox.appendTo(elem);
}

function catCheck(args) {
    setCheckBoxState(ej.base.select('[data=' + args.event.currentTarget.id + ']').querySelectorAll('input'), args.checked);
    getSelectAllState();
}

function compCheck(args) {
    var compDiv = ej.base.closest(args.event.currentTarget, '.comp-chbx');
    var catChbx = ej.base.select('.cat-chbx #' + compDiv.getAttribute('data')).ej2_instances[0];
    var check = getCheckboxState(compDiv.querySelectorAll('input'));
    catChbx.checked = check.check;
    catChbx.indeterminate = check.int;
    getSelectAllState();
}

function getCheckboxState(chbxs) {
    var tCheck = chbxs.length;
    var checkTrue = 0;
    for (var chbx of chbxs) {
        if (chbx.ej2_instances[0].checked) {
            ++checkTrue;
        }
    }
    if (checkTrue === 0) {
        return {
            check: false,
            int: false
        };
    } else if (checkTrue === tCheck) {
        return {
            check: true,
            int: false
        };
    } else {
        return {
            check: false,
            int: true
        };
    }
}

function setCheckBoxState(chbxs, check) {
    for (var chbx of chbxs) {
        chbx.ej2_instances[0].checked = check;
    }
}

function getSelectAllState() {
    var chbxs = ej.base.selectAll('.comp-chbx input');
    var tCheck = chbxs.length;
    var checkTrue = 0;
    for (var chbx of chbxs) {
        if (chbx.ej2_instances[0].checked)
            ++checkTrue
    }
    if (checkTrue === 0) {
        selectAll.checked = false;
        selectAll.indeterminate = false;
        document.getElementById("Apply").disabled = true;
    } else if (checkTrue === tCheck) {
        selectAll.indeterminate = false;
        selectAll.checked = true;
        document.getElementById("Apply").disabled = false;
    } else {
        selectAll.checked = false;
        selectAll.indeterminate = true;
        document.getElementById("Apply").disabled = false;
    }

}

function selectAllState(args) {
    var boolean = args.checked;
    for (let chbx of ej.base.selectAll('.theme-filter-body .cat-chbx [aria-checked="mixed"] input')) {
        chbx.ej2_instances[0].indeterminate = undefined;

    }
    for (let chbx of ej.base.selectAll('.theme-filter-body input')) {
        chbx.ej2_instances[0].checked = args.checked;

    }
    if (boolean) {
        document.getElementById("Apply").disabled = false;
    }
    else {
        document.getElementById("Apply").disabled = true;
    }
}
selectAllState({ checked: true });
getSelectAllState();

function quickfilter(args) {
    selectAllState({
        checked: false
    });
    getSelectAllState();
    var cats = args.value;
    for (var chbx of catchbxs) {
        var id = chbx.id;
        ej.base.closest(ej.base.select('#' + id), '.cat-chbx').classList.remove('filter-hide');
        ej.base.select('[data="' + id + '"]').classList.remove('filter-hide');
        for (var chx of ej.base.selectAll('[data="' + id + '"] div.e-checkbox-wrapper')) {
            chx.classList.remove('filter-hide');
        }
    }
    selectAllDiv.classList.remove('filter-hide');
    if (cats.length !== 0) {
        selectAllDiv.classList.add('filter-hide');
        for (var chbx of catchbxs) {
            var id = chbx.id;
            if (cats.indexOf(id) !== -1) {
                ej.base.closest(ej.base.select('#' + id), '.cat-chbx').classList.remove('filter-hide');
                ej.base.select('[data="' + id + '"]').classList.remove('filter-hide');
                var catgeoryChbx = $('#' + id)[0]
                if (!catgeoryChbx.ej2_instances[0].checked) {
                    catgeoryChbx.click();
                }
            } else {
                ej.base.closest(ej.base.select('#' + id), '.cat-chbx').classList.add('filter-hide');
                ej.base.select('[data="' + id + '"]').classList.add('filter-hide');
            }
        }
    }
}

Array.prototype.diff = function (a1) {
    return this.filter(function (a2) {
        return a1.indexOf(a2) === -1;
    });
};

function filterSearch(value) {

    selectAllState({
        checked: false
    });
    getSelectAllState();
    var filterComps = [];
    quickfilter({
        value: ''
    });
    var selCats = [];
    if (value) {
        selectAllDiv.classList.add('filter-hide');
        var selComps = fsDmData.executeLocal(new ej.data.Query().where('name', 'contains', value, true));
        filterComps = fsData.comps.diff(selComps);
        for (var selComp of selComps) {
            var selCat = fsData.compCat[selComp.name];
            if (selCats.indexOf(selCat) === -1)
                selCats.push(selCat);
        }
    } else {
        return;
    }
    for (var fComp of filterComps) {
        var val = fComp.name;
        ej.base.closest(ej.base.select('.comp-chbx [value="' + val + '"]'), 'div.e-checkbox-wrapper').classList.add('filter-hide');
        if (selCats.indexOf(fsData.compCat[val]) === -1) {
            ej.base.closest(ej.base.select('#' + fsData.compCat[val]), '.cat-chbx').classList.add('filter-hide');
        }
    }
}
//Filtering Script End
var allcomps = [];
var checked = ej.base.selectAll('.theme-filter-body input');
for (var comp of checked) {
    allcomps.push(comp.id);


}

var catCard = {
    'grids': {
        'col-cards': { 'grid': null },
        'big-cards': { 'pivotview': null, "treegrid": null }
    },
    'calendar': {
        'col-cards': { 'calendar': null },
        'big-cards': {
            'schedule': null,
            'gantt': null
        }
    },
    'editors': {
        'col-cards': {
            'cat-editors': ['textbox', 'numerictextbox', 'maskedtextbox', 'slider', 'inplace-editor'],
            'cat-pickers': ['datepicker', 'timepicker', 'datetimepicker', 'daterangepicker'],
            'cat-dropdown': ['auto-complete', 'drop-down-list', 'multi-select', 'combo-box', 'list-box'],
            'cat-button': ['button', 'drop-down-button', 'split-button', 'button-group', 'progress-button'],
            'check-box': null,
            'radio-button': null,
            'uploader': null,
            'color-picker': null,
            'switch': null
        },
        'big-cards': {
            'rich-text-editor': null,
            'chips': null
        }
    },
    'layout': {
        'col-cards': {
            'listview': null,
            'tooltip': null
        },
        'big-cards': {
            'dialog': null,
            'splitter': null
        }
    },
    'forums': {
        'col-cards': {


        },
        'big-cards': {
            'query-builder': null

        }
    },
    'notification': {
        'col-cards': {
            'badge': null,
            'toast': null
        },
        'big-cards': {
            'dialog': null
        }
    },
    'navigation': {
        'col-cards': {
            'treeview': null,
            'toolbar': null,
            'accordion': null,
            'context-menu': null,
            'tab': null,
            'menu': null
        },
        'big-cards': {

            'file-manager': null
        }

    }
};


var selectedComp = {};
var isfilterapplied = false;
var categs = {
    small: {
        compcard: {},
        card: {}
    },
    big: {}
};

var hcomp = [];
function filtering(boolean) {
    if (boolean) {
        var filterObj = {
            comps: { checked: [], unchecked: [] },
            cats: { checked: [], unchecked: [], intermediate: [] }
        };
        var selectall = ej.base.selectAll('.theme-filter-header .theme-filter-selectall input');
        if (selectall[0].ej2_instances[0].checked) {
            isfilterapplied = false;
            renderComponents();
            twocolumn_layout();
            filterDialog.hide();
            document.getElementById('filters').classList.remove('actives');
            updateCdnLinksWithFilter();
            if (virtualizeThemeProperties) {
                _renderProperties(lastRenderedTheme);
            }
            return;
        }

        isfilterapplied = true;

        //Change-start
        var compCheckBoxes = ej.base.selectAll('.theme-filter-body .comp-chbx input');
        var catCheckBoxes = ej.base.selectAll('.theme-filter-body .cat-chbx input');
        for (let compcbx of compCheckBoxes) {
            var compName = compcbx.id.slice(5);
            if (compcbx.ej2_instances[0].checked) {
                filterObj.comps.checked.push(compName);
            } else {
                filterObj.comps.unchecked.push(compName);
            }
        }
        for (let catcbx of catCheckBoxes) {
            var catName = catcbx.id.slice(6);
            var catElements = catcbx.ej2_instances[0].element.parentElement.querySelector('.e-frame');
            if (catElements.classList.contains('e-stop') || catcbx.ej2_instances[0].indeterminate) {
                filterObj.cats.intermediate.push(catName);
            } else if (catcbx.ej2_instances[0].checked) {
                filterObj.cats.checked.push(catName);
            } else {
                filterObj.cats.unchecked.push(catName);
            }
        }
        hcomp = [];
        categs.small.compcard = [];
        categs.small.card = [];
        categs.big = {};
        getCheckedCategories(filterObj.cats.checked, filterObj.comps, true);
        getCheckedCategories(filterObj.cats.intermediate, filterObj.comps, false);
        generatefilterhtml();
        updateCdnLinksWithFilter();
        if (virtualizeThemeProperties) {
            _renderProperties(lastRenderedTheme);
        }
    }

    document.getElementById('filters').classList.add('actives');
    filterDialog.hide();
    document.getElementById('filters').classList.remove('actives');
}

function updateCdnLinksWithFilter() {
    var componentsParam = currentComponents().join(',');
    document.querySelector('.theme-cdn').querySelectorAll('a').forEach(a => {
        a.href = a.href.substring(0, a.href.lastIndexOf('/'));
        if (!a.href.endsWith('/')) {
            a.href += '/';
        }
        if (isfilterapplied) {
            a.href = `${a.href}${componentsParam}`;
        }
        if (varTypeFilter && varTypeFilter.length) {
            a.href += '?varTypes=' + varTypeFilter.join(',');
        }
    });
}

function getCheckedCategories(categories, comps, ischecked) {

    for (let category of categories) {
        var catinfo = catCard[category];
        var smallcards = catinfo['col-cards'];
        Object.keys(smallcards).forEach((smallcard) => {
            var scardvalue = smallcards[smallcard];
            if (scardvalue === null) {
                if (comps.checked.includes(smallcard)) {
                    categs.small.card[smallcard] = scardvalue;
                }
            }
            else if (scardvalue instanceof Array && scardvalue.length > 0) {
                categs.small.compcard[smallcard] = {
                    checked: [],
                    unchecked: []
                }
                if (ischecked) {
                    categs.small.compcard[smallcard].checked = scardvalue;
                }
                else {
                    scardvalue.forEach((compname) => {
                        if (comps.checked.includes(compname)) {
                            categs.small.compcard[smallcard].checked.push(compname);
                        }
                        else {
                            categs.small.compcard[smallcard].unchecked.push(compname);
                        }
                    });
                }
            }
        });
        var bigcards = catinfo['big-cards'];
        Object.keys(bigcards).forEach((bigcard) => {
            var bcardvalue = bigcards[bigcard];
            if (bcardvalue === null) {
                if (comps.checked.includes(bigcard)) {
                    categs.big[bigcard] = bcardvalue;
                }
            }
        });
    }
}

function generatefilterhtml() {
    var twocolumnCollection = ['grid', 'tab', 'toolbar'];
    var count = 1;
    var smallhtml = {
        col1: '', col2: '', col3: ''
    }
    var bightml = '';
    var twocolhtml = '';
    Object.keys(categs.small.card).forEach((c) => {
        if (twocolumnCollection.indexOf(c) !== -1) {
            twocolhtml += cardsContent[c];
        } else {
            smallhtml[`col${count}`] = smallhtml[`col${count}`] + cardsContent[c];
            count = count === 3 ? 1 : ++count;
        }
    });
    Object.keys(categs.small.compcard).forEach((c) => {
        if (categs.small.compcard[c].checked.length > 0) {
            smallhtml[`col${count}`] = smallhtml[`col${count}`] + cardsContent[c];
            count = count === 3 ? 1 : ++count;
            hcomp = hcomp.concat(categs.small.compcard[c].unchecked);
        }
    });

    Object.keys(categs.big).forEach(c => {
        bightml = bightml + cardsContent[c];
    });
    destroyControls();
    $('#col-1').html(smallhtml.col1);
    $('#col-2').html(smallhtml.col2);
    $('#col-3').html(smallhtml.col3);
    $('#big-control').html(bightml);
    $('#two-column-control').html(twocolhtml);
    renderComponents();
    //twocolumn_layout();
    $(hcomp.map(h => `#${h}`).join(',')).hide();
}

/* style dependency methods for exporting starting */
function getdependency(comp_array) {
    var styles = "";
    var resource = "";
    var theme = "";
    window.dependency_arr = [];
    theme = themeDeps(comp_array, window.dependentCollection["styles"], window.dependentCollection["resources"]);
    var packs = Object.keys(theme.compPack);
    dependency_arr = ['base', 'buttons/button'];
    var selectComparray = [];
    var colorpickercomponent = [];
    var filecomponent = [];
    for (var pack of packs) {

        for (var comp of theme.compPack[pack]) {
            if (comp_array.indexOf(comp) !== -1 || dependency_arr.indexOf(comp) !== -1) {

                var styledependency = pack + '/' + (comp === 'listview' ? 'list-view' : comp);
                selectComparray.push(styledependency);

            }
            else {
                if (((comp === "color-picker") && window.dependency_arr.indexOf('button') === -1) && comp !== "file-manager") {
                    var styledependency = pack + '/' + comp;
                    colorpickercomponent.push(styledependency);
                } else if (comp !== "file-manager") {
                    var styledependencys = pack + '/' + (comp === 'listview' ? 'list-view' : comp);
                    window.dependency_arr.push(styledependencys);
                } else {
                    var styledependency = pack + '/' + comp;
                    filecomponent.push(styledependency);
                }

            }


        }

    }
    window.dependency_arr.push('layouts/dashboardlayout');
    window.dependency_arr = window.dependency_arr.concat(selectComparray);
    window.dependency_arr = window.dependency_arr.concat(colorpickercomponent);
    window.dependency_arr = window.dependency_arr.concat(filecomponent);



}
var packMapper = { "listview": "lists", "tooltip": "popups", "badge": "notifications", "toast": "notifications", "button-group": "splitbuttons", "input": "inputs" };
function themeDeps(comps, styles, resources) {
    var theme = {
        packs: [],
        compPack: {},
        allPack: []
    };
    var pack = '';
    var deps = [];
    for (var comp of comps) {
        var packValue = packMapper[comp];
        if (packValue) {
            pack = packValue;
        } else {
            pack = name(resources[comp].package);
        }
        theme = themeProcess(comp, pack, theme, styles);
    }
    return theme;
}

function styleDeps(deps, styles, theme, packName) {
    var pack = '';
    var compName = '';
    for (var dep of deps) {
        var depSplit = dep.split('/');
        if (depSplit[0].indexOf('ej2-') !== -1) {
            if (depSplit.length === 2) {
                pack = name(depSplit[0]);
                compName = depSplit[1];
                theme = themeProcess(compName, pack, theme, styles);
            } else if (depSplit.length === 1) {
                pack = name(dep);
                var comps = styles[pack] ? Object.keys(styles[pack]) : [];
                for (var comp of comps) {
                    theme = themeProcess(comp, pack, theme, styles);
                }
                theme.allPack.push(pack);
            }
        } else if (dep.indexOf('../') !== -1) {
            compName = dep.replace(/(\.\/\.\.\/)|(\.\.\/)/, '');
            theme = themeProcess(compName, packName, theme, styles);
        }
    }
    return theme;
}

function themeProcess(comp, pack, theme, styles) {
    var deps = [];
    if (theme.packs.indexOf(pack) === -1) {
        theme.packs.push(pack);
    }
    if (theme.allPack.indexOf(pack) === -1) {
        if (!theme.compPack[pack]) {
            theme.compPack[pack] = [];
        }
        if (theme.compPack[pack].indexOf(comp) === -1) {
            theme.compPack[pack].push(comp);
            if (styles[pack]) {
                deps = styles[pack][comp];
                if (deps ? deps.length !== 0 : false) {
                    theme = styleDeps(deps, styles, theme, pack);
                }
            }
        }
    }
    return theme;
}

function name(input, bool) {
    if (bool) {
        return input.replace('-').toLowerCase();
    }
    return input.replace(/(ej2-|-)/g, '');
}


/* style dependency ending */


/*importing method */

function importing(boolean) {
    if (boolean) {
        var filecontents;
        var components = [];
        var i = 0;
        var fileElement = document.getElementById("fileuploads");
        var fileread = new FileReader();
        if (!fileElement || !fileElement.files || !fileElement.files[0]) {
            return;
        }
        fileread.readAsText(fileElement.files[0]);
        fileread.onload = function () {
            filecontents = JSON.parse(fileread.result);
            //this.hide();
            var properties = JSON.parse(filecontents.properties);
            components = JSON.parse(filecontents.components);
            var key = Object.keys(properties);
            var element = document.getElementById('theme-properties');
            var colorElement = element.querySelectorAll('.theme-color');
            selectAllState({ checked: false });
            getSelectAllState();
            for (var i = 0; i < components.length; i++) {
                var componentChbx = $('#' + components[i])[0]
                if (!componentChbx.ej2_instances[0].checked) {
                    componentChbx.click();
                }
            }
            //var baseurl = window.location.href;
            //if (baseurl.match(queryRegex)) {
            //    baseurl = baseurl.replace(queryRegex, "");
            //    baseurl = baseurl.trim();
            //}
            //var str = "";
            //str = "?theme=" + filecontents.theme;
            //history.replaceState({}, '', baseurl + str);
            filtering(true);
            filecontents["properties"] = properties;
            var controlSection = document.getElementById('control-section');
            var scrollTop = controlSection.scrollTop;
            themeBodyLeftOverlay.style.backgroundColor = "#383838";
            overlay(false);
            if (filecontents.theme.indexOf("-") === -1) {
                var ajax = new ej.base.Ajax({
                    type: "POST",
                    url: "/Home/ThemeChange",
                    contentType: 'application/json; charset=utf-8',
                    processData: false,
                    data: JSON.stringify(filecontents) // Note it is important
                }, 'POST', true);
                ajax.send();
                ajax.onSuccess = function (data) {
                    applyCustomThemePreview(data);
                    //renderProperties(filecontents.theme);
                    //colorpicker();
                    for (i = 0; i < colorElement.length; i++) {
                        colorElement[i].style.backgroundColor = properties[key[i]];
                    }
                    //document.querySelector('#themelist>.active').classList.remove('active');
                    //document.querySelector('#themelist>#' + filecontents.theme).classList.add('active');
                    //themeDropDownText.innerHTML = filecontents.theme;
                    removeOverlay(false);
                    themeBodyLeftOverlay.style.backgroundColor = "transparent";
                    controlSection.scrollTop = scrollTop;
                }
            }
            else {
                //if (filecontents.theme.indexOf('-light') !== -1) {
                //    filecontents.theme = filecontents.theme.replace('-light', '');
                //} else {
                //        filecontents.theme = filecontents.theme.replace('-dark', '');
                //}
                var components = [];
                componentsId = [];
                var checked = ej.base.selectAll('.theme-filter-body input:checked');
                for (var comp of checked) {
                    if (comp.id.indexOf('cat') == -1) {
                        var compName = comp.id;
                        componentsId.push(compName);
                        compName = compName.replace("comp-", "");
                        compName = compName === 'textbox' ? 'input' : compName;
                        components.push(compName);
                    }


                }
                getdependency(components);
                window.dependency_arr.push("layouts/card");
                filecontents["dependency"] = window.dependency_arr;
                var ajax2 = new ej.base.Ajax({
                    type: "POST",
                    url: "/Home/DarkThemeChange",
                    contentType: 'application/json; charset=utf-8',
                    processData: false,
                    data: JSON.stringify(filecontents)
                }, 'POST', true);
                ajax2.send();
                ajax2.onSuccess = function (data) {
                    applyCustomThemePreview(data);
                    for (i = 0; i < colorElement.length; i++) {
                        colorElement[i].style.backgroundColor = properties[key[i]];
                    }
                    removeOverlay(false);
                    themeBodyLeftOverlay.style.backgroundColor = "transparent";
                    controlSection.scrollTop = scrollTop;
                }
            }

        }

    }
    importDlg.hide();
    document.getElementById('imports').classList.remove('actives');

}

/* importing method end */

/* quick filter */
/* two column component render */
function twocolumn_layout() {
    var col2_element = $('#col-2').children();
    var col3_element = $('#col-3').children();
    var j = 0;
    k = 0;
    for (var i = 0; i < col2_element.length; i++) {
        if (col2_element[i].classList.contains("two-column")) {
            var secondcolumComponentId = col2_element[i].id;
            var id = '#' + secondcolumComponentId;
            var secondColumnheight = $(id).height();
            var height = secondColumnheight + 40;
            height = height + 'px';

            if (i < col3_element.length) {

                var thirdColumnelementId = col3_element[((i - j) + k)].id;
                document.getElementById(thirdColumnelementId).style.marginTop = height;
                k = 1;
            }

        }
        else {
            j++;
        }
    }
}
$(document).keyup(function (e) {
    if (e.keyCode == 27) { // escape key maps to keycode `27`
        filterDialog?.hide();
        exportDialog?.hide();
        importDialog?.hide();
        loginDialog?.hide();
        createDialog?.hide();
    }
})

function colorpicker() {
    ColorHelper.applyColorPickerStyles();
}
function loadDefaultThemes1(theme, rendered) {
    window.themes = theme;
    var darktheme = theme;
    var themeObj = {};
    var baseurl = window.location.href;
    if (baseurl.match(queryRegex)) {
        baseurl = baseurl.replace(queryRegex, "");
        baseurl = baseurl.trim();
    }
    var str = "";
    str = "?theme=" + theme;
    history.replaceState({}, '', baseurl + str);
    theme = theme.trim();
    themeObj['theme'] = theme;
    window.dependency_arr.push("layouts/card");
    themeObj["dependency"] = window.dependency_arr;
    var ajax = new ej.base.Ajax({
        type: "POST",
        url: "/Home/Dark",
        contentType: 'application/json; charset=utf-8',
        processData: false,
        data: JSON.stringify(themeObj)
    }, 'POST', true);
    ajax.send();
    ajax.onSuccess = function (data) {
        applyCustomThemePreview(data);
        destroyControls();
        renderComponents();

        renderRightPane1(darktheme);




        setTimeout(function () {
            removeOverlay(true);
            twocolumn_layout();
        }, 500);

        $('.theme-filter-header').show();
        setTimeout(function () {
            window.dispatchEvent(new Event('resize'));
        }, 500);
    };
}
function renderRightPane1(theme) {
    // theme switcher datasource


    renderProperties(theme);

}