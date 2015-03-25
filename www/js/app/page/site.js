$(function () {

  $(document).delegate('#page-site-list', 'pagebeforeshow', function () {
    $("#btn_sendToServer").hide();
    var cId = App.DataStore.get("cId");
    SiteController.countByCollectionId(cId);
    SiteController.getAllByCollectionId();
    $("#site-list-menu").get(0).selectedIndex = 0;
  });

  $(document).delegate('#btn_create_site', 'click', function () {
    FieldController.getByCollectionId();
    $('#form_create_site')[0].reset();
  });

  $(document).delegate('#page-site-list #site-list-online li', 'click', function () {
    var sId = $(this).attr("data-id");
    App.DataStore.set("sId", sId);
    requireReload(SiteController.renderUpdateSiteFormOnline);
  });
  $(document).delegate('#btn_delete-site', 'click', function () {
    var sId = App.DataStore.get("sId");
    SiteController.deleteBySiteId(sId);
  });

  $(document).delegate('#page-site-list-all', 'pagebeforeshow', function () {
    var currentUser = SessionController.currentUser();
    SiteController.getByUserId(currentUser.id);
  });

  $(document).delegate('#page-site-list-all', 'pageshow', function () {
    $("#offlinesite-list").show();
    $("#offlinesite-list").listview("refresh");
  });

  $(document).delegate('#page-site-list-all li', 'click', function () {
    var sId = $(this).attr("data-id");
    App.DataStore.set("sId", sId);
    $("#btn_back_site_list_all").show();
    $("#btn_back_site_list").hide();
    requireReload(SiteController.renderUpdateSiteFormOffline);
  });

  $(document).delegate(
      '#btn_back_site_in_create , #btn_back_site_list_online , \n\
#btn_back_site_list_all , #btn_back_site_list', 'click', function () {
        if ($(this).attr("id") === "btn_back_site_in_create")
          ValidationHelper.resetFormValidate("#form_create_site");
        PhotoList.clear();
        App.DataStore.clearPartlyAfterCreateSite();
        App.Cache.resetValue();
      });

  $(document).delegate('#page-site-list #site-list li', 'click', function () {
    var sId = $(this).attr("data-id");
    App.DataStore.set("sId", sId);
    $("#btn_back_site_list_all").hide();
    $("#btn_back_site_list").show();
    requireReload(SiteController.renderUpdateSiteFormOffline);
  });

  $(document).delegate('#page-create-site', 'pagebeforeshow', function () {
    InvisibleLayer.invisibleNameLatLng("wrapSiteLocation", "wrapSiteName", function () {
      requireReload(function () {
        var lat = $("#lat").val();
        var lng = $("#lng").val();
        if (lat == "" && lng == "")
          SiteController.getCurrentLocation();
      });
    });
  });
  
  $(document).delegate('#updatelolat, #updatelolng', 'change', function () {
    FieldController.renderLocationField("#updatelolat", "#updatelolng", "update_");
  });

  $(document).delegate('#updatelolat_online, #updatelolng_online', 'change', function () {
    FieldController.renderLocationField("#updatelolat_online", "#updatelolng_online", "update_online_");
  });

  $(document).delegate('#lat, #lng', 'change', function () {
    FieldController.renderLocationField("#lat", "#lng", "");
  });

  function requireReload(callback) {
    if (localStorage['no_update_reload'] != undefined)
      localStorage.removeItem('no_update_reload');
    else {
      callback();
    }
  }
});