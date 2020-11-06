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
    static void UpdateFieldsOnFile_BadDocumentId_Vomit() {
        Arg my = getArgs();
        String badId = '06956000000ubmPAAQ';

        Test.startTest();
        FileUploaderPlusController.UpdateFieldsOnFile(badId, my.fieldsToUpdate);
        Test.stopTest();
    }
}
