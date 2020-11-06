@isTest
class FileUploaderPlusControllerTests {

    @TestSetup
    static void makeData(){
        ContentVersion cv = new ContentVersion(
            Title='Some File',
            PathOnClient = 'myfile.jpg',
            VersionData = Blob.valueOf('File contents'),
            IsMajorVersion = true
        );
        insert cv;
    }

    class Arg {
        ContentVersion cv;
        Map<String,Object> fieldsToUpdate;
    }

    static Arg getArgs() {
        Arg my = new Arg();
        my.cv = [select ContentDocumentId from ContentVersion];
        my.fieldsToUpdate = new Map<String,Object>();
        return my;
    }

    @IsTest
    static void UpdateFieldsOnFile(){
        Arg my = getArgs();

        Test.startTest();
        my.fieldsToUpdate.put('Description', 'Hello world');
        FileUploaderPlusController.UpdateFieldsOnFile(my.cv.ContentDocumentId, my.fieldsToUpdate);
        Test.stopTest();

        my.cv = [Select Description from ContentVersion where id = :my.cv.Id];
        System.assertEquals('Hello world', my.cv.Description, 'Description not set');
    }

    @IsTest
    static void UpdateFieldsOnFile_BadDocumentId_ThrowAuraHandledException() {
        Arg my = getArgs();
        String badId = '06956000000ubmPAAQ';

        Test.startTest();
        Boolean didThrow = false;
        try {
            FileUploaderPlusController.UpdateFieldsOnFile(badId, my.fieldsToUpdate);
        } catch (AuraHandledException e) {
            didThrow = true;
        }
        Test.stopTest();

        System.assertEquals(true, didThrow, 'AuraHandledException was not thrown');
    }

    @IsTest
    static void UpdateFieldsOnFile_InvalidFieldApiName_Vomit() {
        Arg my = getArgs();
        my.fieldsToUpdate.put('InvalidApiName', 'SomeValue');

        Test.startTest();
        Boolean didThrow = false;
        try {
            FileUploaderPlusController.UpdateFieldsOnFile(my.cv.ContentDocumentId, my.fieldsToUpdate);
        } catch (AuraHandledException e) {
            didThrow = true;
        }
        Test.stopTest();

        System.assertEquals(true, didThrow, 'AuraHandledException was not thrown');
    }

    @IsTest
    static void UpdateFieldsOnFile_InvalidValueForField_Vomit() {
        Arg my = getArgs();
        my.fieldsToUpdate.put('Title', 'This is more than 255 characters long. This is more than 255 characters long. This is more than 255 characters long. This is more than 255 characters long. This is more than 255 characters long. This is more than 255 characters long. This is more than 255 characters long. ');

        Test.startTest();
        Boolean didThrow = false;
        try {
            FileUploaderPlusController.UpdateFieldsOnFile(my.cv.ContentDocumentId, my.fieldsToUpdate);
        } catch (AuraHandledException e) {
            didThrow = true;
        }
        Test.stopTest();

        System.assertEquals(true, didThrow, 'AuraHandledExcpetion was not thrown');
    }
}
