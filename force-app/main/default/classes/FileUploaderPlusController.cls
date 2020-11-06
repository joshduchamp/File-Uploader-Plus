public with sharing class FileUploaderPlusController {
    
    @AuraEnabled
    public static void UpdateFieldsOnFile(Id documentId, Map<String,Object> fieldsToUpdate){
        try {
            ContentVersion cv = [select Id from ContentVersion where ContentDocumentId = :documentId and IsLatest = true];
            for (String apiName : fieldsToUpdate.keySet()) {
                Object value = fieldsToUpdate.get(apiName);
                cv.put(apiName, value);
            }
            update cv;
        }
        catch (System.QueryException e) {
            throw new AuraHandledException('Something went wrong trying to find the file to update');
        }
        catch (System.SObjectException e) {
            throw new AuraHandledException('Something went wrong. Make sure Field API names are correct.');
        }
        catch (System.DmlException e) {
            throw new AuraHandledException('Something went wrong trying to update fields. ' + e.getMessage());
        }
    }

}
