( function( blocks, element, blockEditor, components ) {
    const registerBlockType = blocks.registerBlockType,
    Placeholder = components.Placeholder,
    SelectControl = components.SelectControl,
    PanelBody = wp.components.PanelBody,
    TextControl = components.TextControl,
    ColorPalette = wp.components.ColorPalette,
    ToggleControl = components.ToggleControl,
    InspectorControls = blockEditor.InspectorControls,
    useBlockProps = blockEditor.useBlockProps; // API v3 richiede useBlockProps

    var el = element.createElement;
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
        icon: 'location-alt',
        category: 'widgets',
        attributes: {
            map_id: { type: 'string', default: '' },
            height: { type: 'string', default: '500' },
            height_um: { type: 'string', default: 'px' },
            cluster_color: { type: 'string', default: '#ffffff' },
            cluster_bg: { type: 'string', default: '#009CD7' },
            zoom: { type: 'string', default: '12' },
            zoom_scroll: { type: 'boolean', default: false }, // Booleano è più corretto qui
            search: { type: 'boolean', default: false } // Booleano è più corretto qui
        },

        edit: function( props ) {
            const blockProps = useBlockProps(); // Applica le props al wrapper
            const { attributes, setAttributes } = props;
            const { map_id, height, height_um, cluster_color, cluster_bg, zoom, zoom_scroll, search } = attributes;

            return [
                el(
                    'div', { ...blockProps }, // Wrapper principale
                    el(
                        Placeholder, 
                        {
                            key: 'venomap-placeholder',
                            icon: 'location-alt',
                            label: "VenoMap",
                        },
                        el( SelectControl, {
                            label: venomapsBlockVars._select_map,
                            options: templates_active,
                            value: map_id,
                            onChange: (value) => setAttributes({map_id: value}),
                        })
                    )
                ),
                el(
                    InspectorControls,
                    { key: 'venomaps-block-controls' },
                    el(
                        PanelBody, {},
                        el(
                            'div', { className: 'venomaps-form-group' },
                            el( TextControl, {
                                label: venomapsBlockVars._map_height,
                                type: 'number',
                                value: height,
                                onChange: (value) => setAttributes({height: value}),
                            }),
                            el( SelectControl, {
                                label: venomapsBlockVars._units,
                                options: unit_list,
                                value: height_um,
                                onChange: (value) => setAttributes({height_um: value}),
                            })
                        ),
                        el( TextControl, {
                            label: venomapsBlockVars._initial_zoom,
                            type: 'number',
                            value: zoom,
                            min: '2',
                            max: '18',
                            onChange: (value) => setAttributes({zoom: value}),
                        }),
                        el( ToggleControl, {
                            label: venomapsBlockVars._zoom_scroll,
                            checked: zoom_scroll,
                            onChange: (value) => setAttributes({zoom_scroll: value}),
                        }),
                        el( ToggleControl, {
                            label: venomapsBlockVars._search,
                            checked: search,
                            onChange: (value) => setAttributes({search: value}),
                        }),
                        el( 'p', {}, venomapsBlockVars._clusters_background ),
                        el( ColorPalette, {
                            value: cluster_bg,
                            onChange: (value) => setAttributes({cluster_bg: value}),
                        }),
                        el( 'p', {}, venomapsBlockVars._clusters_color ),
                        el( ColorPalette, {
                            value: cluster_color,
                            onChange: (value) => setAttributes({cluster_color: value}),
                        })
                    )
                )
            ];
        },
        save: function (props) {
            const { attributes } = props;
            const scroll_val = attributes.zoom_scroll ? 1 : 0;
            const search_val = attributes.search ? 1 : 0;
            
            return '[venomap id="' + attributes.map_id + '" height="' + attributes.height + attributes.height_um + '" cluster_bg="' + attributes.cluster_bg + '" cluster_color="' + attributes.cluster_color + '" zoom="' + attributes.zoom + '" scroll="' + scroll_val + '" search="' + search_val + '"]';
        },
        deprecated: [
            {
                // Questa è la definizione della VECCHIA versione del blocco.
                attributes: {
                    // Usa gli stessi attributi della vecchia versione.
                    // Nota: 'zoom_scroll' e 'search' erano 'integer' nel tuo codice originale.
                    map_id: { type: 'string', default: '' },
                    height: { type: 'string', default: '500' },
                    height_um: { type: 'string', default: 'px' },
                    cluster_color: { type: 'string', default: '#ffffff' },
                    cluster_bg: { type: 'string', default: '#009CD7' },
                    zoom: { type: 'string', default: '12' },
                    zoom_scroll: { type: 'integer', default: 0 },
                    search: { type: 'integer', default: 0 }
                },
                
                save: function (props) {
                    // Questa funzione deve ricreare l'ESATTA struttura HTML della VECCHIA versione.
                    // In questo caso, un <div> semplice che contiene lo shortcode.
                    const { attributes } = props;

                    return el(
                        'div', 
                        {}, // Nessuna props, quindi nessun 'class'
                        '[venomap id="' + attributes.map_id + '" height="' + attributes.height + attributes.height_um + '" cluster_bg="' + attributes.cluster_bg + '" cluster_color="' + attributes.cluster_color + '" zoom="' + attributes.zoom + '" scroll="' + attributes.zoom_scroll + '" search="' + attributes.search + '" ]'
                    );
                },
            }
        ]
    });
}(
  window.wp.blocks,
  window.wp.element,
  window.wp.blockEditor,
  window.wp.components
) );