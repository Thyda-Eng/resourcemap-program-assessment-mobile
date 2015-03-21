FieldController = {
  getByCollectionId: function () {
    if (App.isOnline())
      this.renderByCollectionIdOnline();
    else
      this.renderByCollectionIdOffline();
  },
  renderByCollectionIdOnline: function () {
    var cId = App.DataStore.get("cId");
    LayerMembership.fetch(cId, function (layerMemberships) {
      FieldModel.fetch(function (layers) {
        var field_id_arr = new Array();
        var field_collections = $.map(layers, function (layer) {
          $.map(layer.fields, function (field) {
            field_id_arr.push(field.id);
          });
          var fields = FieldHelper.buildField(layer, {fromServer: true},
          layerMemberships);
          return fields;
        });
        App.DataStore.set("field_id_arr", JSON.stringify(field_id_arr));
        FieldController.synForCurrentCollection(field_collections);
        FieldHelperView.displayLayerMenu("layer/menu.html", $('#ui-btn-layer-menu'),
            {field_collections: field_collections}, "");
        FieldHelperView.display("field/add.html", $('#div_field_collection'), "",
            {field_collections: field_collections}, false);
      });
    });
  },
  renderByCollectionIdOffline: function () {
    var cId = App.DataStore.get("cId");
    FieldOffline.fetchByCollectionId(cId, function (fields) {
      var field_id_arr = new Array();
      var field_collections = [];
      fields.forEach(function (field) {
        $.map(field.fields(), function (fieldsInfield) {
          field_id_arr.push(fieldsInfield.idfield);
        });
        var item = FieldHelper.buildField(field._data,
            {fromServer: false}, "");
        field_collections.push(item);
      });
      App.DataStore.set("field_id_arr", JSON.stringify(field_id_arr));
      FieldHelperView.displayLayerMenu("layer/menu.html", $('#ui-btn-layer-menu'),
          {field_collections: field_collections}, "");
      FieldHelperView.display("field/add.html", $('#div_field_collection'), "",
          {field_collections: field_collections}, false);
    });
  },
  renderUpdateOffline: function (site) {
    var cId = App.DataStore.get("cId");
    FieldOffline.fetchByCollectionId(cId, function (layers) {
      var field_collections = FieldHelper.buildFieldsUpdate(layers, site, false, "");
      FieldHelperView.displayLayerMenu("layer/menu.html", $('#ui-btn-layer-menu-update'),
          {field_collections: field_collections}, "update_");
      FieldHelperView.display("field/updateOffline.html",
          $('#div_update_field_collection'), "update_",
          {field_collections: field_collections}, true);
    });
  },
  renderUpdateOnline: function (siteData) {
    var cId = App.DataStore.get("cId");
    var sId = localStorage.getItem("sId");

    SitesPermission.fetch(cId, function (site) {
      if ((!site.read && !site.write && !site.none)
          || (site.read.all_sites && site.write.all_sites && site.none.all_sites))
        LayerMembershipsHelper.buildAllLayersOfSite(cId, siteData);
      else
        LayerMembershipsHelper.buildCustomerSitePermission(site, siteData, cId, sId);
    });
  },
  synForCurrentCollection: function (newFields) {
    var cId = App.DataStore.get("cId");
    FieldOffline.fetchByCollectionId(cId, function (fields) {
      FieldOffline.remove(fields);
      FieldOffline.add(newFields);
    });
  },
  updateFieldValueBySiteId: function (propertiesFile, field, idHTMLForUpdate, fromServer) {
    var pf = propertiesFile;
    var itemLayer = fromServer ? FieldHelper.buildField(field, {fromServer: fromServer}, "") :
        FieldHelper.buildField(field._data, {fromServer: fromServer}, "");

    var items = itemLayer.fields;
    $.map(items, function (item) {
      switch (item.widgetType) {
        case "photo":
          FieldController.updateFieldPhotoValue(item, propertiesFile, fromServer);
          break;
        case "date":
          FieldController.updateFieldDateValue(idHTMLForUpdate, item, propertiesFile);
          break;
        case "hierarchy":
          var nodeId = idHTMLForUpdate + item["idfield"];
          var node = $(nodeId).tree('getSelectedNode');
          var data = node.id;
          if (data == null)
            data = "";
          propertiesFile.properties[item["idfield"]] = data;
          break;
        default:
          var nodeId = idHTMLForUpdate + item["idfield"];
          var value = $(nodeId).val();
          if (value == null)
            value = "";
          propertiesFile.properties[item["idfield"]] = value;
      }
    });

    return pf;
  },
  updateFieldPhotoValue: function (item, propertiesFile, fromServer) {
    var idfield = item["idfield"];
    var lPhotoList = PhotoList.count();
    var sId = App.DataStore.get("sId");

    if (fromServer) {
      var filePath = App.DataStore.get(sId + "_" + idfield);
      if (filePath)
        propertiesFile.properties[idfield] = filePath;
      else
        propertiesFile.properties[idfield] = "";
      App.DataStore.remove(sId + "_" + idfield);
    } else {
      var fileName = App.DataStore.get("photoName_" + idfield);
      if (fileName) {
        alert('file name update has');
        propertiesFile.properties[idfield] = fileName;
        for (var i = 0; i < lPhotoList; i++) {
          alert("lphotolist update ");
          if (PhotoList.getPhotos()[i].name == fileName) {
            propertiesFile.properties[idfield] = fileName;
            propertiesFile.files[fileName] = PhotoList.getPhotos()[i].data;
            break;
          }
        }
        App.DataStore.remove("photoName_" + idfield);
      }
      else {
        alert("file name update is null");
        propertiesFile.properties[idfield] = "";
      }
    }
  },
  updateFieldDateValue: function (idHTMLForUpdate, item, propertiesFile) {
    var nodeId = idHTMLForUpdate + item["idfield"];
    var value = $(nodeId).val();
    if (value != "") {
      value = new Date(value);
      value = dateToParam(value);
    }
    propertiesFile.properties[item["idfield"]] = value;
  }
};