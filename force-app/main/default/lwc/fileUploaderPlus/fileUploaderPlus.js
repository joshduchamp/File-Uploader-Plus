import { LightningElement, api, track, wire } from 'lwc';
import updateFileOnField from '@salesforce/apex/FileUploaderPlusController.UpdateFieldsOnFile';
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
            this.updateDisableFileUpload();
        }
    }

    supportedDataTypes = ['String', 'Picklist', 'TextArea'];

    tryAddCustomField(apiName, contentVersionInfo, picklistValues, required) {
        if(apiName != null) {
            let fieldInfo = contentVersionInfo.data.fields[apiName];
            if(!this.supportedDataTypes.includes(fieldInfo.dataType)) {
                return;
            }
            let cf = {
                apiName: apiName,
                value: null,
                label: fieldInfo.label,
                dataType: fieldInfo.dataType,
                length: fieldInfo.length,
                required: required,
                picklistValues: [],
                useTextInput: fieldInfo.dataType == 'String',
                useComboBox: fieldInfo.dataType == 'Picklist',
                useTextArea: fieldInfo.dataType == 'TextArea'
            };
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
        this.customFields[index].value = event.detail.value;
        this.updateDisableFileUpload();
    }

    updateDisableFileUpload() {
        this.disableFileUpload = this.customFields.some((value) => {
            return value.required && (value.value == null || value.value == '');
        });
    }

    handleFileUploadFinished(event) {
        if (event.detail.files == null || event.detail.files.length < 1) {
            alert('Failed to upload file');
            return;
        }
        let hasFieldsToUpdate = this.customFields.length > 0;
        if (hasFieldsToUpdate) {
            let documentId = event.detail.files[0].documentId;
            let file = {
                title: event.detail.files[0].name,
                documentId: documentId,
                fields: []
            };
            let params = {
                documentId: documentId,
                fieldsToUpdate: {}
            };
            this.customFields.forEach(cf => {
                params.fieldsToUpdate[cf.apiName] = cf.value;
            });
            updateFileOnField(params)
                .then((res) => {
                    if (res == false) {
                        alert('Failed to update fields on file');
                    } else {
                        file.fields = this.customFields.map((cf) => {
                            return { apiName: cf.apiName, label: cf.label, value: cf.value }
                        });
                    }
                })
                .catch((err) => {
                    alert('Failed to update fields on file');
                    console.log(err);
                })
                .finally(() => {
                    this.uploadedFiles.push(file);
                    this.refreshComponent();
                });
        }
    }

    refreshComponent() {
        this.customFields.forEach((cf) => { cf.value = null});
        this.updateDisableFileUpload();
    }
}