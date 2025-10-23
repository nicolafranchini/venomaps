( function( blocks, element, blockEditor, components ) {
    const registerBlockType = blocks.registerBlockType,
    Placeholder = components.Placeholder,
    SelectControl = components.SelectControl,
    PanelBody = wp.components.PanelBody,
    TextControl = components.TextControl,
    ColorPalette = wp.components.ColorPalette,
    ColorPicker = wp.components.ColorPicker,
    CheckboxControl = components.CheckboxControl,
    ToggleControl = components.ToggleControl,
    // FormTokenField = components.FormTokenField,
    InspectorControls = blockEditor.InspectorControls;

    var el = element.createElement;
    var templates_active = [];
    var templates_active = [ { label: '--', value : '' } ];
    var templates = JSON.parse( venomapsBlockVars.templates );

    Object.keys(templates).forEach(function(index) {
      templates_active.push({ label: templates[index], value : index });  
    });

    const unit_list = [
        { label: 'px', value: 'px' },
        { label: 'vh', value: 'vh' }
    ];

    registerBlockType( 'venomaps/venomap', {
        title: 'VenoMaps',
        // description: '',
        icon: 'location-alt',
        category: 'widgets',
        attributes: {
            content: {
                type: 'array',
                source: 'children',
                selector: 'div',
            },
            map_id: { type: 'string', default: '' },
            height: { type: 'string', default: '500' },
            height_um: { type: 'string', default: 'px' },
            cluster_color: { type: 'string', default: '#ffffff' },
            cluster_bg: { type: 'string', default: '#009CD7' },
            zoom: { type: 'string', default: '12' },
            zoom_scroll: { type: 'integer', default: 0 },
            search: { type: 'integer', default: 0 },
            // search_for: { type: 'array', default: [] }
        },
        edit: function( props ) {
            var map_id_init = props.attributes.map_id || '';
            var height_init = props.attributes.height || '500';
            var height_um_init = props.attributes.height_um || 'px';
            var cluster_color_init = props.attributes.cluster_color || '#ffffff';
            var cluster_bg_init = props.attributes.cluster_bg || '#009CD7';
            var zoom_init = props.attributes.zoom || 12;
            var zoom_scroll_init = props.attributes.zoom_scroll || 0;
            var search_init = props.attributes.search || 0;
            // var search_for_init = props.attributes.search_for || [];
            return [
                el(
                    Placeholder, 
                    {
                        key: 'venomap-placeholder',
                        icon: 'location-alt',
                        label: "VenoMap",
                    },
                    el(
                        'div',
                        {
                            className: 'venomaps-form-group'
                        },
                        el(
                            SelectControl,
                            {
                                label: venomapsBlockVars._select_map,
                                // help : ' ',
                                options: templates_active,
                                value: map_id_init,
                                onChange: function(value) {
                                    props.setAttributes({map_id: value});
                                },
                                className: 'venomaps_block_map_id'
                            }
                        ),

                    )
                ),
                el(
                    InspectorControls,
                    {key: 'venomaps-block-controls'},
                    el(
                        PanelBody, {},
                        el(
                            'div',
                            {
                                className: 'venomaps-form-group'
                            },
                            el(
                                TextControl,
                                {
                                    label: venomapsBlockVars._map_height,
                                    type: 'number',
                                    min: '1',
                                    step: '1',
                                    value: height_init,
                                    onChange: function(value) {
                                        props.setAttributes({height: value});
                                    },
                                    className: 'venomaps_block_map_height'
                                },
                            ),
                            el(
                                SelectControl,
                                {
                                    label: venomapsBlockVars._units,
                                    options: unit_list,
                                    value: height_um_init,
                                    onChange: function(value) {
                                        props.setAttributes({height_um: value});
                                    },
                                    className: 'venomaps_block_map_units'
                                }
                            ),
                        ),
                        el(
                            TextControl,
                            {
                                label: venomapsBlockVars._initial_zoom,
                                type: 'number',
                                value: zoom_init,
                                min: '2',
                                max: '18',
                                step: '1',
                                onChange: function(value) {
                                    props.setAttributes({zoom: value});
                                },
                                className: 'venomaps_block_zoom'
                            },
                        ),
                        el(
                            ToggleControl,
                            {
                                label: venomapsBlockVars._zoom_scroll,
                                checked: zoom_scroll_init,
                                onChange: function(value) {
                                    var state = value ? 1 : 0;
                                    props.setAttributes({zoom_scroll: state});
                                }
                            }
                        ),
                        el(
                            ToggleControl,
                            {
                                label: venomapsBlockVars._search,
                                checked: search_init,
                                onChange: function(value) {
                                    var state = value ? 1 : 0;
                                    props.setAttributes({search: state});
                                }
                            }
                        ),
                        // el(
                        //     FormTokenField,
                        //     {
                        //         label: venomapsBlockVars._search_suggestions,
                        //         value: search_for_init,
                        //         onChange: function(tokens) {
                        //             var state = tokens ? tokens : [];
                        //             // var state = value ? 1 : 0;
                        //             props.setAttributes({search_for: tokens});
                        //         }
                        //     }
                        // ),
                        el(
                            'p',
                            {},
                            venomapsBlockVars._clusters_background,
                        ),
                        el(
                            ColorPalette,
                            {
                                value: cluster_bg_init,
                                onChange: function(value) {
                                    props.setAttributes({cluster_bg: value});
                                }
                            }
                        ),
                        el(
                            'p',
                            {},
                            venomapsBlockVars._clusters_color,
                        ),
                        el(
                            ColorPalette,
                            {
                                value: cluster_color_init,
                                onChange: function(value) {
                                    props.setAttributes({cluster_color: value});
                                }
                            }
                        ),
                    )
                )
            ]; // return 
        },
        save: function (props) {
            return el(
                'div', {}, '[venomap id="' + props.attributes.map_id + '" height="' + props.attributes.height + props.attributes.height_um + '" cluster_bg="' + props.attributes.cluster_bg + '" cluster_color="' + props.attributes.cluster_color + '" zoom="' + props.attributes.zoom + '" scroll="' + props.attributes.zoom_scroll + '" search="' + props.attributes.search + '" ]'
            )
        },

        deprecated: [
            {
                attributes: {
                        content: {
                        type: 'array',
                        source: 'children',
                        selector: 'div',
                    },
                    map_id: { type: 'string', default: '' },
                    height: { type: 'string', default: '500' },
                    height_um: { type: 'string', default: 'px' },
                    cluster_color: { type: 'string', default: '#ffffff' },
                    cluster_bg: { type: 'string', default: '#009CD7' },
                    zoom: { type: 'string', default: '12' },
                    zoom_scroll: { type: 'integer', default: 0 },
                },
                save: function (props) {
                    return el(
                        'div', {}, '[venomap id="' + props.attributes.map_id + '" height="' + props.attributes.height + props.attributes.height_um + '" cluster_bg="' + props.attributes.cluster_bg + '" cluster_color="' + props.attributes.cluster_color + '" zoom="' + props.attributes.zoom + '" scroll="' + props.attributes.zoom_scroll + '"]'
                    )
                }   
            }
        ]
    });
}(
  window.wp.blocks,
  window.wp.element,
  window.wp.blockEditor,
  window.wp.components
) );