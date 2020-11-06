public with sharing class FileUploaderPlusController {
    
    @AuraEnabled
    public static void UpdateFieldsOnFile(Id documentId, Map<String,Object> fieldsToUpdate){
        ContentVersion cv = [select Id from ContentVersion where ContentDocumentId = :documentId and IsLatest = true];
        for (String apiName : fieldsToUpdate.keySet()) {
            Object value = fieldsToUpdate.get(apiName);
            cv.put(apiName, value);
        }
        update cv;
    }

}
