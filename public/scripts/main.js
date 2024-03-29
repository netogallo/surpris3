const SERVER = "http://netowork.me:4000";

var surpris3 = {
	user_info: null,
	login: function _login() {
		FB.login(function(){
			surpris3.check_login();
		}, {scope: 'publish_actions'});
	},
	logout: function _logout() {
		surpris3.clear_user_info();
	},
	place_user_info: function _userInfo(data) {
		this.user_info = data;
		$(".profilename").html(data.name);
		$(".profilepic").attr("src", data.picture.data.url);
		$(".nav_logged_out").hide();
		$(".nav_logged_in").show();
		$(".pb_vote_up").show();
		$(".pb_vote_down").show();
		surpris3.unable_votes();
		$.ajax("/score/" + surpris3.user_info.id, {type: "GET", success: function(rsp){
			if(!rsp.error){
				$(".profilepoints").html(rsp.score);
				$(".profilepoints").show();
			}
		}});
	},
	clear_user_info: function _clearUser(){
		this.user_info = null;
		$(".nav_logged_in").hide();
		$(".profilename").html("");
		$(".profilepic").attr("src", "images/placeholder.jpg");
		$(".profilepoints").html("");
		$(".profilepoints").hide();
		$(".nav_logged_out").show();
		$(".pb_vote_up").hide();
		$(".pb_vote_down").hide();
	},
	upload: function _upload_photobomb() {
		var allFields = true;

		if($("#inputName").val().length == 0){
			$("#inputName").parent().parent().addClass("error");
			allFields = false;
		}

		if($("#inputURL").val().length == 0){
			$("#inputURL").parent().parent().addClass("error");
			allFields = false;
		}

		if(surpris3.user_info && allFields){
			rqst = {};
			rqst.user_id = surpris3.user_info.id;
			rqst.picture_url = $("#inputURL").val();
			rqst.name = $("#inputName").val();
			rqst.competition = $("#inputCompetition").attr("checked") ? true : false;
			var rqst_str = JSON.stringify(rqst);

			$.ajax("/upload_picture", {type:"POST", data: {arg:rqst_str}, success: function(rsp){
				if(!rsp.error){
					FB.api('/me/surprise_photo:photobomb', 'post', { picture : (SERVER + '/photobomb/' + rsp.result._id.toString())}, function(rsp){});
					$("#pb_upload").modal('hide');
					$("#inputName").val("");
					$("#inputURL").val("");
					$("#inputCompetition").removeAttr("checked");
				} else {
					$("#server_error").show();
				}
			}});
		} else if (!surpris3.user_info) {
			$("#user_upload_error").show();
		}
	},
	vote_up: function _vote_up(id) {
		if(surpris3.user_info !== null){
			var rqst = {};
			rqst.user_id = surpris3.user_info.id;
			rqst.photobomb_id = id;
			rqst.value = 1;
			var rqst_str = JSON.stringify(rqst);
			$.ajax("/place_vote", {type: "POST", data:{arg:rqst_str}, success:function(rsp){
				if(!rsp.error){
					$(".pb_" + id + " .pb_vote_up").hide();
					$(".pb_" + id + " .pb_vote_down").hide();
					var count = parseInt($(".pb_" + id + " .pb_vote_count").html(), 10);
					count++;
					$(".pb_" + id + " .pb_vote_count").html(count);
					FB.api('/me/surprise_photo:voted_up', 'post', {picture : (SERVER + '/photobomb/' + rqst.photobomb_id.toString())}, function(rsp){});
				}
			}});
		}
	},
	vote_down: function _vote_down(id) {
		if(surpris3.user_info !== null){
			var rqst = {};
			rqst.user_id = surpris3.user_info.id;
			rqst.photobomb_id = id;
			rqst.value = -1;
			var rqst_str = JSON.stringify(rqst);
			$.ajax("/place_vote", {type: "POST", data: {arg:rqst_str}, success: function(rsp){
				if(!rsp.error){
					$(".pb_" + id + " .pb_vote_up").hide();
					$(".pb_" + id + " .pb_vote_down").hide();
					var count = parseInt($(".pb_" + id + " .pb_vote_count").html(), 10);
					count++;
					$(".pb_" + id + " .pb_vote_count").html(count);
				}
			}});
		}
	},
	check_login: function _check_login() {
		FB.getLoginStatus(function(response) {
		  if (response.status === 'connected') {
		  	FB.api("/me", {fields: "picture, name"}, function(resp){
		  		surpris3.place_user_info(resp);
		  		surpris3.register_user(resp);
		  	});
		  }
		 });
	}, 
	register_user: function _register(data) {
		var user_str = JSON.stringify(data);
		$.ajax("/create_user", {type: "POST", data: {arg:user_str}, success: function(){}});
	},
	unable_votes: function _remove_votes() {
		if(surpris3.user_info){
			$.ajax("/votes/" + surpris3.user_info.id, {type: "GET", success: function(rsp){
				for(var i=0; i < rsp.length; i++){
					$(".pb_"+rsp[i]+" .pb_vote_up").hide();
					$(".pb_"+rsp[i]+" .pb_vote_down").hide();
				}
			}});
		}
	}
};

(function($){
	$(".pagination").width($(".pagination ul").width());
	$(".pagination").css("margin", "0px auto");
})(jQuery);
