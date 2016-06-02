
/**
 * Created by Lei Yang, 2016/4/2
 */
package org.tagsys.tagsee;

import java.util.Date;
import java.util.HashMap;

import com.google.gson.Gson;

public class JsonResult extends HashMap<String, Object>{
	
	
	private static final long serialVersionUID = 1L;
	
	private static Gson gson = new Gson();
	
	public JsonResult(){
		this(0);
	}

	public JsonResult(int errorCode){
		
		this.put("errorCode", errorCode);
		this.put("timestamp", new Date().getTime());
		
	}
	
	public JsonResult(int errorCode, String errorMessage){
		this.put("errorMessage", errorMessage);
	}
	
	public int getErrorCode(){
		return (int)this.get("errorCode");
	}
	
	public void setErrorCode(int errorCode){
		this.put("errorCode", errorCode);
	}
	
	public String getErrorMessage(){
		return (String)this.get("errorMessage");
	}
	
	public void setErrorMessage(String message){
		this.put("errorMessage", message);
	}
	
	@Override
	public String toString(){
		String message =  (String)this.get("errorMessage");
		if(message==null){
			switch(this.getErrorCode()){
				case 1002: message = "This reader has been in the hub."; break;
				case 500: message = "Internal error";break;
				case -1: message="Unknown error";break;
			}
			this.setErrorMessage(message);
		}
		return gson.toJson(this);
	}
	
}
