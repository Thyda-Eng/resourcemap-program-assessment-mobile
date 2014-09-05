$(function(){

  $(document).delegate('#btn_sendToServer', 'click', function() {
    var cId = App.DataStore.get("cId");
    SiteController.submitAllToServerByCollectionId("collection_id", cId);
  });

  $(document).delegate('#btn_sendToServerAll', 'click', function() {
    var currentUser = SessionController.currentUser();
    SiteController.submitAllToServerByUserId("user_id", currentUser.id);
  });
});