FieldController = {
  activeLayer: null,
  layers: [],
  submited: false,
  templateName: "",
  site: { properties: {}, files: {} },
  isOnline: true,

  reset: function(){
    this.activeLayer = null
    this.layers = []
    this.submited = false
    this.templateName = ""
    this.site = { properties: {}, files: {} }
    this.isOnline = true
  },

  fieldIds: function() {
    var fieldIds = []
    $.each(this.layers, function(_, layer){
      $.each(layer.fields, function(_, field){
        fieldIds.push(field.idfield)
      })
    })
    return fieldIds;
  },

  findFieldById: function(idfield) {
    for(var i=0; i<this.layers.length; i++) {
      for(var j=0; j<this.layers[i].fields.length; j++){
        if(this.layers[i].fields[j].idfield == idfield)
          return this.layers[i].fields[j];
      }
    }
    return null;
  },

  renderLayer: function(layerData, $layerNodeContent){

    var content = App.Template.process(this.templateName, {fields: layerData.fields});
    $layerNodeContent.html(content);
    $layerNodeContent.enhanceWithin();

    $.each(layerData.fields, function(_, field){
      if(field.kind == 'hierarchy'){
        console.log("value ", field.__value);
        Hierarchy.create(field.config, field.__value, field.idfield);
      }

      if (field.custom_widgeted)
        CustomWidget.setInputNodeId(field.idfield, field);

      if (field.kind === "calculation" && field.config.dependent_fields) {
        $.each(field.config.dependent_fields, function (i, dependent_field) {
          $("#" + dependent_field.id).addClass('calculation');
        });
      }
      // SkipLogic.disableUIEditSite
      DigitAllowance.prepareEventListenerOnKeyPress();
      // Readonly field
      var site = FieldController.site
      // if (!MyMembershipController.canEdit(site)) {
      //   $(".tree").off('click'); //field hierarchy
      //   var select = $('.validateSelectFields').parent('.ui-select'); //field select
      //   select.click(function () {
      //     return false;
      //   });
      // }

    })
  },

  renderLayerSet: function(templateName, $element, prefixIdElement) {
    this.templateName = "layer_field";
    var cloneLayers = this.layers.slice(0)
    var options = {field_collections: cloneLayers}

    FieldHelperView.display(templateName, $element, prefixIdElement, options, this.isOnline);
  },

  setLayerStatus: function(layer, valid) {
    layer.invalid = !valid
    if(valid == true){
      $.each(layer.fields, function(_, field) {
        field.invalid = ''
      })
    }
  },

  validateLayerCollapseFields: function($layerNode){
    if(this.activeLayer){
      return this.validateLayerUI($layerNode)
    }
    return true
  },

  validateLayerUI: function($layerNode){
    var layer = this.findLayerById($layerNode.attr('data-id'))
    var valid = $.mobile.activePage.find("#form-site-fields").valid()

    console.log("form valid: ", valid);
    var fieldUIs = validateImages();
    fieldUIs = fieldUIs.concat(validateHierarchy());

    for(var i=0; i<fieldUIs.length; i++){
      var fieldUI = fieldUIs[i];
      var field = FieldController.findFieldById(fieldUI.id)
      if(field) {
        console.log("update field validation to status", field);
        field.invalid = fieldUI.error
      }
      else{
        console.log("not found: ", fieldUI);
      }
      if(fieldUI.error)
        valid = false
    }
    layer.valid = valid;
    valid ? $layerNode.removeClass("error") : $layerNode.addClass("error")
    console.log("valid ", valid);
    return valid;
  },

  validateLayer: function(layer){
    if(!layer.valid)
      return false;

    for(var i=0; i<layer.fields.length; i++){
      var validField = FieldController.validateField(layer.fields[i]);
      layer.fields[i].invalid = !validField
      if(!validField)
        layer.valid = false
    }
    var $layerNode = $("#collapsable_" + layer.id_wrapper)
    console.log("setting layer node: ", $layerNode);
    layer.valid ? $layerNode.removeClass("error") : $layerNode.addClass("error")
    console.log('validating layer:', layer.valid);
    return layer.valid;
  },

  validateField: function(field){

    if(field.required=="" || field.disableState){
      console.log("not required or disabled", true);
      return true
    }

    if(field.invalid || !field.__value){
      console.log("field invalid or not value --- ", false);
      return false;
    }


    if(field.kind == 'numeric' && field.config && field.config.range) {
      if(field.__value >= field.config.range.minimum && field.__value <=field.config.range.maximum ){
        console.log("field number with range match " + field.__value + " --- ", false );
        return true;
      }
      else {
        console.log("range not matched --- ", false);
        return false;
      }
    }
    return true;
  },

  validateLayers: function(){
    var valid = true
    for(var i=0; i < this.layers.length; i++) {
      var layerValid = FieldController.validateLayer(this.layers[i]);
      if(layerValid == false)
        valid = false
    }
  },

  storeOldLayerFields: function($layerNode){
    console.log("store layer");
    var layer = this.findLayerById($layerNode.attr('data-id'));

    $.each(layer.fields, function(i, field) {
      if(field.kind !== 'hierarchy'){
        var value = FieldController.getFieldValueFromUI(field.idfield)
        FieldHelper.setFieldValue(field, value, this.isOnline);
      }
    })
  },

  prepareLayerExpandFields: function($layerNode) {
    if(this.activeLayer) {
      var layerChanged = $layerNode.attr('data-id') != this.activeLayer.attr('data-id')
      if(layerChanged) {
        this.storeOldLayerFields(this.activeLayer);
        this.removeLayerContent(this.activeLayer);
        this.renderLayerNode($layerNode)
      }
    }
    else
      this.renderLayerNode($layerNode);
  },

  removeLayerContent: function($layerNode){
    $layerNode.find(".ui-collapsible-content").html("")
  },

  renderLayerNode: function($layerNode) {
    console.log("render new layer node");
    var layerId = $layerNode.attr('data-id')
    var $layerNodeBody = $layerNode.find(".ui-collapsible-content")
    var layerData = FieldController.findLayerById(layerId);

    this.renderLayer(layerData, $layerNodeBody);
    this.activeLayer = $layerNode;
  },

  findLayerById: function(layerId) {
    for(var i=0; i<this.layers.length; i++){
      if(this.layers[i].id_wrapper == layerId)
        return this.layers[i];
    }
  },

  findLayerWrapperOfFieldId: function (fieldId) {
    for(var i=0 ; i<this.layers.length ; i++) {
      var layer = this.layers[i];
      for(var j=0; j<layer.fields.length; j++) {
        if(layer.fields[j].idfield == fieldId ) {
          var $layerRef = $("#site-layers-wrapper div.ui-collapsible");
          var $layerNode = $($layerRef.get(i))
          return $layerNode;
        }
      }
    }
  },

  layerDirty: function() {
    for(var i=0; i<this.layers.length; i++){
      if(this.layers[i].rendered === true)
        return true
    }
    return false
  },

  buildLayerFields: function(layer) {
    return FieldHelper.buildLayerFields(layer, this.isOnline)
  },

  renderNewSiteForm: function () {
    // this.templateName = "layer_fields_add"
    this.reset();
    this.site = { properties: {}, files: {} }
    App.isOnline() ? this.renderNewSiteFormOnline() : this.renderNewSiteFormOffline();
  },

  renderNewSiteFormOnline: function () {
    this.isOnline = true
    var self = this;

    FieldModel.fetch(function (layers) {
      $.each(layers, function(_, layer){
        var layerFields = FieldHelper.buildLayerFields(layer, {fromServer: true});
        self.layers.push(layerFields);
      })

      FieldController.synForCurrentCollection(self.layers);

      FieldHelperView.displayLayerMenu("layer_menu", $('#ui-btn-layer-menu'),
          {field_collections: self.layers.slice(0)}, "");

      FieldController.renderLayerSet("field_add", $('#div_field_collection'), "");

      ViewBinding.setBusy(false);
      Location.prepareLocation();
    }, FieldController.errorFetchingField);
  },

  errorFetchingField: function(error) {
    if (!App.isOnline())
      FieldController.renderByCollectionIdOffline();
  },

  renderNewSiteFormOffline: function () {
    this.isOnline = false;

    var cId = App.DataStore.get("cId");
    var self = this;
    self.layers = [];

    FieldOffline.fetchByCollectionId(cId, function (layerOfflines) {
      if(layerOfflines.length == 0)
        FieldHelperView.displayNoFields("field_no_field_pop_up", $('#page-pop-up-no-fields'));

      layerOfflines.forEach(function (layerOffline) {
        var layer = FieldHelper.buildLayerFields(layerOffline, false);
        self.layers.push(layer);
      });

      FieldHelperView.displayLayerMenu("layer_menu", $('#ui-btn-layer-menu'), {field_collections: self.layers.slice(0)}, "");
      FieldController.renderLayerSet("field_add", $('#div_field_collection'), "");
      ViewBinding.setBusy(false);

      Location.prepareLocation();
    });
  },

  renderUpdate: function(site, offline) {
    this.reset()
    this.isOnline = !offline
    this.isOnline ? this.renderUpdateOnline(site) : this.renderUpdateOffline(site)
  },

  renderUpdateOffline: function (site) {
    this.isOnline = false
    this.site = site;
    this.templateName =  "layer_field_update_offline";
    var self = this;


    var cId = site.collection_id;
    App.DataStore.set('cId', site.collection_id)
    self.layers = []

    FieldOffline.fetchByCollectionId(cId, function (layerOfflines) {
      $.each(layerOfflines, function (_, layerOffline) {
        var newLayer = FieldController.buildLayerFields(layerOffline);
        self.layers.push(newLayer);
      });

      FieldHelperView.displayLayerMenu("layer_menu", $('#ui-btn-layer-menu-update'), {field_collections: self.layers.slice(0)}, "update_");
      // FieldController.renderLayerSet("field_update_offline", $('#div_update_field_collection'), "update_");
      FieldController.renderLayerSet("field_add", $('#div_field_collection'), "");
    });
  },

  renderUpdateOnline: function (site) {
    this.isOnline = true;
    this.site = site;
    this.templateName = "layer_field_update_online";

    var self = this;
    self.layers = [];
    App.DataStore.set("cId", site.collection_id);

    FieldModel.fetch(function (layerOnlines) {
      $.each(layerOnlines, function (_, layerOnline) {
        var newLayer = FieldController.buildLayerFields(layerOnline);
        self.layers.push(newLayer);
      });

      var prefix = ""; //"update_online_";

      FieldHelperView.displayLayerMenu("layer_menu", $('#ui-btn-layer-menu-update-online'),
          {field_collections: self.layers.slice(0)}, prefix);

      // FieldController.renderLayerSet("field_update_online", $('#div_update_field_collection_online'), prefix);
      FieldController.renderLayerSet("field_add", $('#div_field_collection'), "");

    }, FieldController.errorFetchingField);
  },

  //this.site.properties[fieldId] = fileName;
  //this.site.files[fileName] = photoValue["data"];
  getFieldValueFromUI: function(fieldId) {
    var $field = $('#' + fieldId);
    if($field.length == 0)
      return null;

    if ($field[0].tagName.toLowerCase() == 'img') {
      if ($("#wrapper_" + fieldId).attr("class") != 'ui-disabled skip-logic-over-img') {
        var photoValue = PhotoList.value(fieldId)
        return photoValue["data"];
      }
    }

    if ($field[0].getAttribute("type") == 'date')
      return convertDateWidgetToParam($field.val());

    var klass = $field[0].getAttribute("class");
    if (klass == "tree" || klass == "tree unhighlighted" || klass == "tree calculation") {
      var nodeId = $field.tree('getSelectedNode').id
      return nodeId === null ? "" : nodeId;
    }
    else {
      var value = $field.val();
      return  value == null ? "" : value;
    }
  },


  synForCurrentCollection: function (newFields) {
    var cId = App.DataStore.get("cId");
    FieldOffline.fetchByCollectionId(cId, function (fields) {
      FieldOffline.remove(fields);
      FieldOffline.add(newFields);
    });
  },

  updateFieldValueBySiteId: function (propertiesFile, layer, idHTMLForUpdate, fromServer) {
    var pf = propertiesFile;
    var layerFields = FieldHelper.buildLayerFields(layer,fromServer);

    $.each(layerFields.fields, function (_, field) {
      if (field.isPhoto)
        FieldController.updateFieldPhotoValue(field, propertiesFile, fromServer);

      else if (field.widgetType === "date")
        FieldController.updateFieldDateValue(idHTMLForUpdate, field, propertiesFile);

      else if (field.widgetType === "hierarchy") {
        var nodeId = idHTMLForUpdate + field["idfield"];
        var node = $(nodeId).tree('getSelectedNode');
        var data = node.id;
        if (data == null)
          data = "";
        propertiesFile.properties[field["idfield"]] = data;
      }
      else {
        var nodeId = idHTMLForUpdate + field["idfield"];
        var value = $(nodeId).val();
        if (value == null)
          value = "";
        propertiesFile.properties[field["idfield"]] = value;
      }
    });
    return pf;
  },

  updateFieldPhotoValue: function (field, propertiesFile, fromServer) {
    var idfield = field.idfield;
    var sId = App.DataStore.get("sId");

    if (fromServer) {
      var filePath = App.DataStore.get(sId + "_" + idfield);
      if (filePath == null)
        propertiesFile.properties[idfield] = "";
      else
        propertiesFile.properties[idfield] = filePath;
    }
    else {
      var fileData = App.DataStore.get(sId + "_" + idfield + "_fileData");
      var fileNameLocal = App.DataStore.get(sId + "_" + idfield + "_fileName");
      if (fileData == null || fileNameLocal == null)
        propertiesFile.properties[idfield] = "";
      else {
        propertiesFile.properties[idfield] = fileNameLocal;
        propertiesFile.files[fileNameLocal] = fileData;
      }
    }

    for (var i = 0; i < PhotoList.getPhotos().length; i++) {
      if (PhotoList.getPhotos()[i].id == idfield && PhotoList.getPhotos()[i].sId == sId) {
        var fileName = PhotoList.getPhotos()[i].name();
        propertiesFile.properties[idfield] = fileName;
        propertiesFile.files[fileName] = PhotoList.getPhotos()[i].data;
        break;
      }
    }
  },

  updateFieldDateValue: function (idHTMLForUpdate, field, propertiesFile) {
    var nodeId = idHTMLForUpdate + field["idfield"];
    var value = $(nodeId).val();
    if (value != "") {
      value = convertDateWidgetToParam(value);
    }
    propertiesFile.properties[field["idfield"]] = value;
  },

  renderLocationField: function (textLat, textLng, prefixId) {
    var lat = $(textLat).val();
    var lng = $(textLng).val();

    $.each(this.layers, function(_, layer){
      $.each(layer.fields, function(_, field){
        if(field.kind == "location") {
          var config = field.config;
          var locationOptions = Location.getLocations(lat, lng, config);
          if (locationOptions)
            config.locationOptions = locationOptions;
          var $element = $("#" + prefixId + field.idfield);
          FieldHelperView.displayLocationField("field_location", $element, {config: config});
        }
      })
    })

  }
};
