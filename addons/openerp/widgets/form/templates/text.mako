% if editable:
        <textarea rows="6" id ="${name}" name="${name}" class="${css_class}"
            ${py.attrs(attrs, kind=kind)} style="width: 100%;">${value}</textarea>
        <script type="text/javascript">
            if (!window.browser.isWebKit) {
                new openerp.ui.TextArea('${name}');
            }
        </script>

    % if error:
        <span class="fielderror">${error}</span>
    % endif
% else:
    <p kind="${kind}" id="${name}" class="raw-text">${value}</p>
% endif

