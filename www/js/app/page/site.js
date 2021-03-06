$(function () {

  $(document).delegate('#page-site-list', 'pageshow', function () {
    App.emptyHTML();
    $("#btn_sendToServer").hide();
    var cId = App.DataStore.get("cId");
    SiteController.countByCollectionId(cId);
    SiteModel.sitePage = 0;
    SiteOffline.sitePage = 0;
    SiteController.getAllByCollectionId();
    $("#site-list-menu").get(0).selectedIndex = 0;
  });

  $(document).delegate('#page-site-list', 'pagehide', function () {
    if ($.mobile.activePage.is("#page-create-site")) {
      ViewBinding.setBusy(true);
    }
  });

  $(document).delegate('#btn_create_site', 'click', function () {
    MyMembershipObj.setSite("");
    FieldController.getByCollectionId();
    $('#form_create_site')[0].reset();
  });

  $(document).delegate('#btn_back_site_list', 'click', function () {
    App.DataStore.clearPartlyAfterCreateSite();
  });

  $(document).delegate('#page-create-site', 'pageshow', function () {
    SiteController.setEntryDate();
  });

  $(document).delegate('#page-site-list #site-list-online li', 'click', function () {
    var sId = $(this).attr('data-id');
    if (sId == "load-more-site-online") {
      $("#" + sId).remove();
      SiteModel.sitePage++;
      SiteController.getByCollectionIdOnline();
    } else {
      App.DataStore.set("sId", sId);
      SiteController.renderUpdateSiteFormOnline();
    }
  });

  $(document).delegate('#page-site-list #site-list li', 'click', function () {
    var sId = $(this).attr('data-id');
    if (sId == "load-more-site-offline") {
      $("#" + sId).remove();
      SiteOffline.sitePage++;
      SiteController.getByCollectionIdOffline();
    } else {
      App.DataStore.set("sId", sId);
      $("#btn_back_site_list_all").hide();
      $("#btn_back_site_list").show();
      SiteController.renderUpdateSiteFormOffline();
    }
  });

  $(document).delegate('#page-site-list-all li', 'click', function () {
    var sId = $(this).attr('data-id');
    var uId = SessionController.currentUser().id;
    if (sId == "load-more-site-all") {
      $("#" + sId).remove();
      SiteOffline.sitePage++;
      SiteController.getByUserId(uId);
    } else {
      App.DataStore.set("sId", sId);
      $("#btn_back_site_list_all").show();
      $("#btn_back_site_list").hide();
      SiteController.renderUpdateSiteFormOffline();
    }
  });

  $(document).delegate('#btn_delete-site', 'click', function () {
    var sId = App.DataStore.get("sId");
    SiteController.deleteBySiteId(sId);
  });

  $(document).delegate('#page-site-list-all', 'pagebeforeshow', function () {
    App.emptyHTML();
    var currentUser = SessionController.currentUser();
    SiteOffline.sitePage = 0;
    SiteController.getByUserId(currentUser.id);
  });

  $(document).delegate(
      '#page-site-list , #page-collection-list , \n\
#page-site-list-all ', 'pageshow', function () {
        App.DataStore.clearConfig("configNumberSkipLogic");
        App.DataStore.clearConfig("configNumber");
        App.DataStore.clearConfig("configSelectManyForSkipLogic");
        App.DataStore.clearConfig("configLocations");
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
});
