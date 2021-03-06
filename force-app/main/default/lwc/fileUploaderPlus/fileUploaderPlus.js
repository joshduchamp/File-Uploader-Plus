import { LightningElement, api, track, wire } from 'lwc';
import updateFieldsOnFile from '@salesforce/apex/FileUploaderPlusController.UpdateFieldsOnFile';
import { getObjectInfo, getPicklistValuesByRecordType } from 'lightning/uiObjectInfoApi';
import CONTENT_VERSION_OBJECT from '@salesforce/schema/ContentVersion';

export default class FileUploaderPlus extends LightningElement {
    @api recordId;
    @api customFieldApiName;
    @api customFieldRequired;
    @api customFieldApiName2;
    @api customFieldRequired2;
    @api customFieldApiName3;
    @api customFieldRequired3;
    @api customFieldApiName4;
    @api customFieldRequired4;
    @api customFieldApiName5;
    @api customFieldRequired5;
    @track customFields = [];
    @track disableFileUpload = true;
    @track uploadedFiles = [];

    @wire(getObjectInfo, {objectApiName: CONTENT_VERSION_OBJECT}) contentVersionInfo;

    @wire(getPicklistValuesByRecordType, {objectApiName: CONTENT_VERSION_OBJECT, recordTypeId: '$contentVersionInfo.data.defaultRecordTypeId'})
    setupCustomFields(res) {
        if (res.data != null && this.contentVersionInfo != null && this.customFields.length == 0) {
            let picklistValues = res.data;
            this.tryAddCustomField(this.customFieldApiName, this.contentVersionInfo, picklistValues, this.customFieldRequired);
            this.tryAddCustomField(this.customFieldApiName2, this.contentVersionInfo, picklistValues, this.customFieldRequired2);
            this.tryAddCustomField(this.customFieldApiName3, this.contentVersionInfo, picklistValues, this.customFieldRequired3);
            this.tryAddCustomField(this.customFieldApiName4, this.contentVersionInfo, picklistValues, this.customFieldRequired4);
            this.tryAddCustomField(this.customFieldApiName5, this.contentVersionInfo, picklistValues, this.customFieldRequired5);
            this.updateDisableFileUpload();
        }
    }

    supportedDataTypes = ['String', 'Picklist', 'TextArea', 'Boolean'];

    tryAddCustomField(apiName, contentVersionInfo, picklistValues, required) {
        if(apiName != null) {
            let fieldInfo = contentVersionInfo.data.fields[apiName];
            if(!this.supportedDataTypes.includes(fieldInfo.dataType)) {
                return;
            }
            let cf = {
                apiName: apiName,
                defaultValue: fieldInfo.dataType == 'Boolean' ? false : null,
                label: fieldInfo.label,
                dataType: fieldInfo.dataType,
                length: fieldInfo.length,
                required: required,
                picklistValues: [],
                useTextInput: fieldInfo.dataType == 'String',
                useComboBox: fieldInfo.dataType == 'Picklist',
                useTextArea: fieldInfo.dataType == 'TextArea',
                useCheckbox: fieldInfo.dataType == 'Boolean'
            };
            cf.value = cf.defaultValue;
            if (cf.dataType == 'Picklist') {
                cf.picklistValues = picklistValues.picklistFieldValues[apiName].values.map((v) => {
                    return { label: v.label, value: v.value };
                });
            }
            this.customFields.push(cf);
        }
    }

    handleCustomFieldValueChanged(event) {
        let index = event.target.closest('[data-index]').dataset.index;
        let cf = this.customFields[index];
        if (cf.useCheckbox) {
            cf.value = event.detail.checked;
        } else {
            cf.value = event.deatil.value;
        }
        this.updateDisableFileUpload();
    }

    updateDisableFileUpload() {
        this.disableFileUpload = this.customFields.some((value) => {
            return value.required && (value.value == null || value.value == '');
        });
    }

    async handleFileUploadFinished(event) {
        if (event.detail.files == null || event.detail.files.length < 1) {
            alert('Failed to upload file');
            return;
        }
        let documentId = event.detail.files[0].documentId;
        let file = {
            title: event.detail.files[0].name,
            documentId: documentId,
            fields: []
        };
        let hasFieldsToUpdate = this.customFields.length > 0;
        if (hasFieldsToUpdate) {
            await this.updateFields(documentId);
            file.fields = this.customFields.map((cf) => {
                return { apiName: cf.apiName, label: cf.label, value: cf.value }
            });
        }
        this.uploadedFiles.push(file);
        this.refreshComponent();
    }

    async updateFields(documentId) {
        let params = {
            documentId: documentId,
            fieldsToUpdate: {}
        };
        this.customFields.forEach(cf => {
            params.fieldsToUpdate[cf.apiName] = cf.value;
        });
        var promise = updateFieldsOnFile(params)
            .catch((err) => {
                alert('Failed to update fields on file');
                console.log(err);
            });
        return promise;
    }

    refreshComponent() {
        this.customFields.forEach((cf) => { 
            cf.value = cf.defaultValue;
        });
        this.updateDisableFileUpload();
    }
}