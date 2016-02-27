function PCSubWin()
{
	if((httpAutErrorArray[0] == 2) || (httpAutErrorArray[0] == 3))
	{
		if(true == CheckUserPswInvalid())
		{
			var username = $("userName").value;
			var password = $("pcPassword").value;
			if(httpAutErrorArray[1] == 1)
			{
				password = hex_md5($("pcPassword").value);
			}
			var auth = "Basic "+ Base64Encoding(username + ":" + password);
			document.cookie = "Authorization="+escape(auth)+";path=/";
			location.href ="../userRpm/LoginRpm.htm?Save=Save";
			return true;
		}
		else
		{
			$("note").innerHTML = "NOTE:";
			$("tip").innerHTML = "Username and password can contain between 1 - 15 characters and may not include spaces.";
		}
	}
	return false;
}

