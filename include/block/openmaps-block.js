( function( blocks, element, blockEditor, components ) {
    const registerBlockType = blocks.registerBlockType,
    createBlock = blocks.createBlock,
    Placeholder = components.Placeholder,
    SelectControl = components.SelectControl,
    PanelBody = wp.components.PanelBody,
    InspectorControls = blockEditor.InspectorControls;

    var el = element.createElement;
    var templates_active = [];
    var templates_active = [ { label: '--', value : '' } ];
    var templates = JSON.parse( openmapsBlockVars.templates );

    Object.keys(templates).forEach(function(index) {
      templates_active.push({ label: templates[index], value : index });  
    });

    registerBlockType( 'openmaps/openmap', {
        title: 'OpenMaps',
        // description: '',
        icon: 'location-alt',
        category: 'widgets',
        attributes: {
          content: {
            type: 'array',
            source: 'children',
            selector: 'div',
          },
          map_id: { type: 'int', default: '' },
        },

        edit: function( props ) {
            var map_id_init = props.attributes.map_id || '';
            return [
                el(
                    Placeholder, 
                    {
                        key: 'openmap-placeholder',
                        icon: 'location-alt',
                        label: "OpenMap",
                    },
                    el(
                        SelectControl,
                        {
                            label: openmapsBlockVars._select_map,
                            help : ' ',
                            options: templates_active,
                            value: map_id_init,
                            onChange: function(value) {
                                props.setAttributes({map_id: value});
                            }
                        }
                    )
                )
            ]; // return 
        },
        save: function (props) {
            return el(
                'div', {}, '[openmap id="'+props.attributes.map_id+'"]'
            )
        }
    } );
}(
  window.wp.blocks,
  window.wp.element,
  window.wp.blockEditor,
  window.wp.components
) );