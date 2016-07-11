
FieldHelper = {
  buildLayerFields: function (layer, isOnline) {
    var layerData = isOnline ? layer : layer._data;

    var newLayer = {
      cId: CollectionController.id,
      userId: UserSession.getUser().id,
      name_wrapper: isOnline ?  layerData.name : layerData.name_wrapper,
      id_wrapper: isOnline ? layerData.id : layerData.id_wrapper,
      valid: true,
      fields: []
    }

    $.each(layer.fields, function (_, field) {
      var fieldForUI = FieldHelper.fieldForUI(field, isOnline)

      for(fieldId in FieldController.site.properties) {
        if(fieldId == fieldForUI.idfield){
          FieldHelper.setFieldValue(fieldForUI, FieldController.site.properties[fieldId], isOnline);
          break;
        }
      }
      newLayer.fields.push(fieldForUI);
    });

    return newLayer;
  },

  fieldForUI: function(field, isOnline){
    var widgetMapper = { "numeric": "number", "yes_no": "select_one", "phone": "tel",
                         "location": "select_one", "calculation": "text" }

    var fieldUI = {
      idfield: isOnline ? field.id : field.idfield,
      name: field.name,
      kind: field.kind,
      code: field.code,
      config: field.config,
      multiple: (field.kind === "select_many" ? "multiple" : ""),
      isPhoto: (field.kind === "photo" ? true : false),
      isHierarchy: (field.kind === "hierarchy" ? true : false),
      isCustomWidget: (field.kind === "custom_widget" ? true : false),
      is_enable_field_logic: field.is_enable_field_logic,
      custom_widgeted: field.custom_widgeted,
      readonly_custom_widgeted: field.readonly_custom_widgeted,
      is_mandatory: field.is_mandatory,
      is_display_field: field.is_display_field,
      invisible: '',
      slider: '',
      ctrue: '',
      readonly: '',
      disableState: false,
      __value: '',
      invalid: ''
    };
    if(field.custom_widgeted )
      fieldUI.widgetType = 'custom_widget_tokenizer';
    else if (widgetMapper[field.kind])
      fieldUI.widgetType = widgetMapper[field.kind];
    else
      fieldUI.widgetType = fieldUI.kind;

    fieldUI.required =  fieldUI.is_mandatory ? "required" : ""

    if (fieldUI.kind === "select_one" && fieldUI.is_enable_field_logic) {
      console.log("field: ", fieldUI);
      fieldUI.config = FieldHelper.buildFieldSelectOne(field.config);
      if (!fieldUI.config.field_logics)
        fieldUI.is_enable_field_logic = false;
    }

    if (fieldUI.kind === "yes_no") {
      fieldUI.config = FieldHelper.buildFieldYesNo(fieldUI.config, isOnline);
      fieldUI.slider = "slider";
      fieldUI.ctrue = "true";
    }

    if (fieldUI.kind === "calculation") {
      fieldUI.readonly = 'readonly';

      if (!fieldUI.is_display_field)
        fieldUI.invisible = "invisble-div";
    }

    if (fieldUI.kind === "custom_widget")
      fieldUI.config = FieldHelper.buildFieldCustomWidget(fieldUI.config, fieldUI.readonly_custom_widgeted);

    if (fieldUI.kind == 'location')
      fieldUI.config.locationOptions = Location.getLocations(FieldController.site.lat, FieldController.site.lng, fieldUI.config);

    var can_edit = MyMembershipController.canEdit(FieldController.site);

    if (fieldUI.kind == 'yes_no')
      fieldUI.editable = can_edit ? "" : "disabled";
    else
      fieldUI.editable = can_edit ? "" : "readonly";

    return fieldUI;
  },

  buildFieldCustomWidget: function (config, readonly){
    widgetContent = config["widget_content"];
    regExp = /(&nbsp;)|\{([^}]*)\}/mg ;
    widgetContent = widgetContent.replace(regExp, function(match, space, token) {
        replace = space || token ;
        if(replace === "&nbsp;")
          replaceBy = '';
        else{
            isReadOnly = readonly ? " data-readonly='readonly' " : ""
            replaceBy = '<div data-custom-widget-code="'
                          + replace +'" ' + isReadOnly +  '></div>';

        }
       return replaceBy;
    });

    config.widget_content = widgetContent;
    return config;
  },

  buildFieldSelectOne: function (config) {

    $.each(config.options, function ( _ , option) {
      if (config.field_logics) {
        $.each(config.field_logics, function ( _ , fieldLogic) {
          if (option.id === fieldLogic.value && !option["field_id"])
            option["field_id"] = fieldLogic.field_id;
        });
      }
    });
    console.log("config: ", config);
    return config;

  },

  buildFieldYesNo: function (config, isOnline) {
    var field_id0, field_id1;
    if (isOnline) {
      if (config && config.field_logics) {
        field_id0 = config.field_logics[0].field_id;
        field_id1 = config.field_logics[1].field_id;
      }
    }
    else {
      field_id0 = config.options[0].field_id;
      field_id1 = config.options[1].field_id;
    }
    config = {
      options: [{
          id: 0,
          label: "NO",
          code: "1",
          field_id: field_id0
        },
        {id: 1,
          label: "YES",
          code: "2",
          field_id: field_id1
        }]
    };
    return config;
  },

  setFieldValue: function (field, value, isOnline) {
    switch (field.kind) {
      case "photo" :
        if (isOnline)
          field.__value = SiteCamera.imagePath(value);
        else {
          if(FieldController.site.files && FieldController.site.files[value])
            field.__value = SiteCamera.dataWithMimeType(FieldController.site.files[value]);
          else
            field.__value = "";
        }
        break;
      case "select_many":
      case "select_one":
      case "yes_no":
        field.__value = value;
        $.each(field.config.options, function(k, option){
          if(typeof field.__value == "boolean"){
            if(option.id == field.__value || option.code == field.__value)
               field.config.options[k]["selected"] = "selected";
          }
          else if (field.__value instanceof Array) {
            $.each(field.__value, function(_, valueOption){
              if (option.id == valueOption || option.code == valueOption)
                field.config.options[k]["selected"] = "selected";
            })
          }

          else if(option.id == field.__value || option.code == field.__value) {
            field.config.options[k]["selected"] = "selected";
          }
        })
        break;

      case "location":
        field.__value = value;
        for (var k = 0; k < field.config.locationOptions.length; k++) {
          field.config.locationOptions[k]["selected"] = "";
          if (field.config.locationOptions[k].code == field.__value) {
            field.config.locationOptions[k]["selected"] = "selected";
          }
        }
        break;
      case "hierarchy":
        field.__value = value;
        field._selected = Hierarchy._selected;
        break;
      case "date":
        if (value) {
          var date = value.split("T")[0];
          field.__value = convertDateWidgetToParam(date);
        }
        break;
      case "numeric":
      case "calculation":
        field.__value = value;
        if (value && field.config.allows_decimals == "true" && field.config.digits_precision && !isNaN(parseFloat(value))){
          var floatValue = parseFloat(value);
          field.__value = Number(floatValue.toFixed(parseInt(field.config.digits_precision)));
        }
        break;
      default:
        field.__value = value;
    }
  },

  generateCodeToIdSelectManyOption: function (field, values) {
    var codeIds = [];
    $.each(field.config.options, function (_, option) {
      if(values.indexOf(option.code) != -1)
        codeIds.push(option.id);
    });

    if (codeIds.length === 0)
      codeIds = values;
    return codeIds;
  }
};
