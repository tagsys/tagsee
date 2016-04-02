
/**
 * Created by Lei Yang, 2016/4/2
 */
package org.tagsys.tagsee;

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
		return gson.toJson(this);
	}
	
}
