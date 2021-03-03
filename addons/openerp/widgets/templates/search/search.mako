<div id="search_filter_data">
    % if frame:
        ${display_member(frame)}
    % endif

    % if not source:
        <tr>
           <td>
                <table id="filter_option_table" style="display:none;">
                    <tbody id="filter_table" style="display:none;">
                        <tr class="filter_row_class">
                            <td class="image_col">
                                <button onclick="remove_filter_row(this); return false;">
                                    <img alt="Remove filter row" src="/openerp/static/images/button-b-icons-remove.gif"/>
                                </button>
                            </td>
                            <td class="label" style="text-align: left;">
                                <label id="filterlabel" value=""></label>
                            </td>
                            <td>
                                <select class="expr" />
                            </td>
                            <td colspan="2" align="right" class="filter_column">
                                <input class='qstring' />
                            </td>
                        </tr>
                    </tbody>
                    <tbody class="actions">
                        <tr class="actions">
                            <td colspan="2" class="label">
                                <label for="add_filter_and">And</label>
                                <select class="filter_fields_and" onchange="add_filter_row(this); return jQuery('select.filter_fields_and').val('');">
                                    <option></option>
                                    % for field in fields_list:
                                    <option kind="${field[2]}" value="${field[0]}">${field[1]}</option>
                                    % endfor
                                </select>
                            </td>
                            <td id="filter_column" class="label" colspan="2">
                                <label for="add_filter_or">Or</label>
                                <select id="filter_fields_or" disabled="disabled" class="filter_fields_or" onchange="addOrBlock(this); return jQuery('select.filter_fields_or').val('');">
                                    <option></option>
                                    % for field in fields_list:
                                        <option kind="${field[2]}" value="${field[0]}">${field[1]}</option>
                                    % endfor
                                </select>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </td>
        </tr>
    <script type="text/javascript">
        % if fields_selection_json:
          var fields_selection_json = JSON.parse('${fields_selection_json|n}');
        % endif

        var operator_input = $("<select class=\"expr\" onchange=\"jQuery(this).parents('tr.filter_row_class').find('input.qstring')[0].focus()\">");
        var operator_date_digit = $("<select class=\"expr\" onchange=\"jQuery(this).parents('tr.filter_row_class').find('input.qstring')[0].focus()\">");
        var operator_rel = $("<select class=\"expr\" onchange=\"jQuery(this).parents('tr.filter_row_class').find('input.qstring')[0].focus()\">");
        var operator_select = $("<select class=\"expr\" onchange=\"jQuery(this).parents('tr.filter_row_class').find('select.qstring')[0].focus()\">");
        % for operator, description in operators_map:
            operator_input.append('<option value="${operator}">${description}</option>')
            % if operator in ('=', '<>'):
                operator_select.append('<option value="${operator}">${description}</option>')
            % endif
            % if operator in ('=', '<>', '>', '<'):
                operator_date_digit.append('<option value="${operator}">${description}</option>')
            % endif
            % if operator not in ('>', '<'):
                operator_rel.append('<option value="${operator}">${description}</option>')
            % endif
        % endfor

        var value_input=$('<input type="text" class="qstring" value="" autofocus="true"/>');
    </script>
    % endif

    <script type="text/javascript">
        jQuery(document).ready(function () {
            switch_searchView("${flt_domain | n}");
    });
    </script>
</div>
