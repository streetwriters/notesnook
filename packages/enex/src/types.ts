/*

  Evernote Note Export Format, 4.0 DTD

  This DTD defines the legal structure of Evernote export format.  This
  defines the permitted placement of each data element, but it does not
  directly enforce validation of the content of each field.
  
  The semantics of each element in the export format is defined in the
  "Types.thrift" interface specification document for the EDAM API.
  The permitted value for each field is also defined in the "Limits.thrift"
  interface specification, which includes permitted lengths and expressions.
  
  All date/time values must be encoded using a specific fixed-length profile
  of ISO 8601, with times translated to UTC/Zulu:
    yyyymmddThhmmssZ
  For example, 5:42:09 PM GMT on January 20th, 2007 would be encoded as:
    20070120T174209Z
  
  Please see the comments in this DTD file to indicate the expected format
  of each data element.
  
  This DTD module is identified by the PUBLIC and SYSTEM identifiers:
  
  PUBLIC "en-export"
  SYSTEM "http://xml.evernote.com/pub/evernote-export4.dtd"
  
*/

export interface IEnexElement {
  validate(): void;
}

export enum DateUIOption {
  DateTime = "date_time",
  DateOnly = "date_only",
  RelativeToDue = "relative_to_due",
}
