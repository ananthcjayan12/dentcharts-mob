export type LocalConsentLanguage = 'en' | 'ml';

type LocalConsentSection = {
  heading?: string | null;
  body?: string;
  items?: string[];
  numbered?: string[];
  footer?: string;
};

type LocalConsentEntry = {
  label?: string;
  short?: string;
  title?: string;
  text?: string;
  sections: Array<LocalConsentSection | string>;
};

export type LocalConsentTemplateSource = {
  en: Record<string, LocalConsentEntry>;
  ml: Record<string, LocalConsentEntry>;
};

// FE-owned consent template source.
// Keep EN/ML templates in sync here for builder usage.
export const consentTemplateSource: LocalConsentTemplateSource = 
{
  "en": {
    "general": {
      "label": "General Dentistry Informed Consent Form",
      "short": "General dentistry",
      "sections": [],
      "text": "My current dental condition ({condition}), the proposed treatment ({procedure}), its benefits, risks, and alternative treatment options have been clearly explained to me by Dr. {doctor}.\n\nI understand that if an unexpected clinical situation is discovered during the treatment, the treatment plan may need to be modified accordingly.\n\nI have had the opportunity to ask questions, and I am satisfied with the answers provided. I voluntarily consent to the proposed treatment."
    },
    "endodontic": {
      "label": "Endodontic Consent and Information Form",
      "short": "Endodontic",
      "sections": [
        {
          "heading": null,
          "body": "We would like our patients to be informed about the various procedures involved in endodontics therapy and have their consent before starting treatment. Conservative root canal therapy or endodontic surgery might be required for complete treatment of the tooth. The following discusses possible risks that may occur from endodontic treatment and other treatment choices."
        },
        {
          "heading": "Risks Specific to Endodontic Therapy",
          "body": "The risks include:",
          "items": [
            "The possibility of instruments breakage within the root canals: extra openings of the crown or root of the tooth.",
            "Damaged bridges, existing fillings, crowns or porcelain veneers.",
            "Loss of tooth structure in gaining access to canals.",
            "Cracked teeth."
          ],
          "footer": "During treatment, complications may occur which make treatment impossible or which may require dental surgery."
        },
        {
          "heading": "Other Treatment Choices",
          "body": "These include no treatment, waiting for more definite development of symptoms or tooth extraction. Risks involved in these choices might include pain, infection, swelling, loss of teeth and infection to other areas."
        },
        {
          "heading": "Consent",
          "body": "I, the undersigned, being the patient (parents or guardian of minor patient) consent to the performing of procedures decided upon to be necessary or advisable in the opinion of the doctor. I understand that root canal treatment is an attempt to save a tooth that might otherwise required extraction. Although root canal therapy has a very high degree of success, it cannot be guaranteed."
        }
      ],
      "text": "I, the undersigned, being the patient (parents or guardian of minor patient) consent to the performing of procedures decided upon to be necessary or advisable in the opinion of {doctor}. I understand that root canal treatment is an attempt to save {condition} that might otherwise required extraction. Although root canal therapy has a very high degree of success, it cannot be guaranteed.\n\nConservative root canal therapy or endodontic surgery might be required for complete treatment of the tooth. I understand that {procedure} has been recommended."
    },
    "oral_surgery": {
      "label": "Consent Form for Oral Surgery / Wisdom Teeth Removal",
      "short": "Oral surgery",
      "sections": [
        {
          "heading": null,
          "body": "I have been advised to have the following procedure(s) performed: {procedure}\n\nI understand why this treatment has been recommended. I understand the nature of the surgical procedure and have had opportunity to discuss it with the operator. I have been given options for anesthesia and have chosen: {anesthesia}\n\nI understand that I can choose to be referred out for a general anesthetic at a hospital, or for overall management by an Oral & Maxillofacial Surgeon. I understand that {doctor} is not a specialist Oral & Maxillofacial surgeon, but a general Dental Surgeon who has routinely practiced oral surgery, such as wisdom teeth removal. I understand that wisdom teeth removal and oral surgery, like any surgical procedure, are not without risk."
        },
        {
          "heading": "These risks include:",
          "items": [
            "Swelling and stiffness of the jaw – usually lasting about a week.",
            "Bleeding – usually easily controlled and rarely requiring medical attention.",
            "Pain and discomfort – usually well controlled by prescribed pain killers.",
            "Infection – uncommon, particularly if good oral hygiene is maintained after surgery.",
            "Dry socket – leading to a persistently painful tooth socket which can be slow to heal, and which would require further management (most common with smokers).",
            "Damage to adjacent teeth and fractures of the mandible – these are very rare complications and you will be advised if this risk applies to you.",
            "Numbness, tingling and altered sensation of the lip, chin, tongue, gums and back teeth – this is due to the proximity of two nerves which supply these areas, to lower wisdom teeth. If this takes place, it can last for months and very rarely be permanent.",
            "Sinus perforation, communication or root displacement – can take place where an upper back tooth root which protrudes into the maxillary sinus is removed. A second surgical procedure may be required to manage such problems.",
            "Allergy or other adverse reaction to drugs which are administered – such as anaesthetics and sedatives.",
            "The risks and benefits for the procedure have been discussed with me to my satisfaction, including the risks and benefits of no treatment."
          ]
        }
      ],
      "text": "I have been advised to have the following procedure(s) performed: {procedure}\n\nI understand why this treatment has been recommended. I understand the nature of the surgical procedure and have had opportunity to discuss it with {doctor}. I understand that I can choose to be referred out for a general anesthetic at a hospital, or for overall management by an Oral & Maxillofacial Surgeon. I understand that wisdom teeth removal and oral surgery, like any surgical procedure, are not without risk.\n\nThe risks and benefits for the procedure have been discussed with me to my satisfaction, including the risks and benefits of no treatment."
    },
    "implants": {
      "label": "Consent for Dental Implants",
      "short": "Dental implants",
      "sections": [
        {
          "heading": null,
          "body": "After a careful oral examination and study of my dental condition, {doctor} has advised me that my missing tooth/teeth may be replaced with artificial teeth supported by dental implants as follows: {condition}\n\nAll risks/benefits and instructions pertaining to sedation and surgical complications appear on the “Surgical Consent” sheet. I have selected the above treatment and have read and understand all items pertaining to the “Surgical Consent” sheet.",
          "items": [
            "In order to treat this condition, {doctor} has recommended that my treatment include dental implant(s) to be implanted into the jawbone. I understand that this surgical phase is followed by a prosthetic phase where artificial dentures, bridges or crowns are placed by the dentist/prosthodontist.",
            "I understand that sedation may be utilized and that a local anesthetic will be administered to me as part of the treatment. My gum tissue will be opened to expose the bone, implants will be placed and the gum tissue will be sutured during the healing phase.",
            "I understand that the healing phase of surgery varies from patient to patient and case to case, but typically last between 2-6 months. I understand that dentures or partial dentures that place pressure on the surgical site are to be avoided for 1-2 weeks following surgery.",
            "I further understand that if during surgery the clinical situations turn out to be unfavorable for the implant, {doctor} will make a professional judgment to manage this. This includes canceling the procedure, supplemental bone and soft tissue grafting to allow placement, gum closure and security of the dental implants. These procedures might be done in conjunction or separately from the implant placement.",
            "I understand that some implants require second stage surgeries. Overlying tissues will be opened at the appropriate time and the stability of the implant will be verified. If the implant appears satisfactory, an attachment will be connected to the implant. The artificial crown fabrication may begin after healing of this soft tissue. I understand that I will be referred back to my dentist/prosthodontist to have this artificial crown/denture treatment.",
            "Expected benefits: The purpose of dental implants is to allow me to have more functional artificial teeth and an improved appearance. The implants provide support, anchorage and retention for the artificial replacement.",
            "Principal risks and complications: I understand that a small number of patients do not respond successfully to implant placement. In such cases, implants may have to be removed and replaced. Because each patient’s conditions are unique, long-term success may not occur. I understand that complications may result from the implant surgery, drugs or anesthetics.",
            "There is no method that will accurately predict or evaluate how my gum and bone will heal. I understand that there may be a need for a revision procedure if the initial results are not satisfactory. In addition, the success of dental implant procedures can be affected by medical conditions, dietary and nutritional problems, smoking, alcohol consumption, clenching and grinding of teeth, inadequate oral hygiene and medications that I may be taking.",
            "To my knowledge, I have reported to {doctor} any prior drug reactions, allergies, diseases, symptoms, habits or conditions which might in any way relate to this surgical procedure. I understand that my diligence in providing the personal daily care recommended by {doctor} and taking all medications as prescribed are important to the ultimate success of the procedure.",
            "Alternatives to suggested treatment: I understand that alternatives to dental implant surgery include: No treatment, removable appliances and other procedures depending on circumstances.",
            "Necessary follow-up and self-care: I understand that it is important for me to continue regular visits to dentist. Implants, natural teeth and appliances must be maintained in a clean, hygienic manner. Implants and appliances should be examined by the dentist or {doctor} periodically."
          ]
        },
        {
          "heading": "Patient Consent",
          "body": "I have been fully informed of the nature of implant surgery, the procedure to be utilized, the risks and benefits of implant surgery and the selected anesthesia, the alternative treatments available and the necessity for follow-up and self-care. I have had an opportunity to ask any questions I may have in connection with the treatment and to discuss my concerns with {doctor}.\n\nI hereby consent to the performance of dental implant surgery as presented to me during consultation and the treatment plan as described in this document. I CERTIFY THAT I HAVE READ AND FULLY UNDERSTAND THIS CONSENT DOCUMENT: DENTAL IMPLANT SURGERY CONSENT FORM."
        }
      ],
      "text": "After a careful oral examination and study of my dental condition, {doctor} has advised me that my missing tooth/teeth may be replaced with artificial teeth supported by dental implants.\n\nI have been fully informed of the nature of implant surgery, the procedure to be utilized, the risks and benefits of implant surgery and the selected anesthesia, the alternative treatments available and the necessity for follow-up and self-care. I have had an opportunity to ask any questions I may have in connection with the treatment.\n\nI hereby consent to the performance of {procedure} as presented to me during consultation. I CERTIFY THAT I HAVE READ AND FULLY UNDERSTAND THIS CONSENT DOCUMENT: DENTAL IMPLANT SURGERY CONSENT FORM."
    },
    "periodontal": {
      "label": "Consent for Periodontal Surgery",
      "short": "Periodontal",
      "sections": [
        {
          "heading": "Diagnosis",
          "body": "On careful oral examination and study of my dental condition, {doctor} has advised me that I have periodontal (gum) disease. I understand that periodontal disease weakens support of my teeth by separating the gum from the teeth and can also be destructive for the bone that supports the teeth. This separation of the gums (pockets) allows for greater accumulation of bacteria under the gum and can result in further erosion or loss of bone and gum supporting the roots of my teeth. If untreated, periodontal disease can cause teeth loss and has other adverse consequences."
        },
        {
          "heading": "Recommended Treatment",
          "body": "My dentist has recommended periodontal surgery. I understand that sedation may be utilized and that a local anesthetic will be administered to me as part of the treatment. I further understand that antibiotics and other substances may be applied to the roots of my teeth.\n\nDuring this procedure, my gum will be opened to permit better access to the roots and to the eroded bone. Inflamed and infected gum tissue will be removed and the root surfaces will be thoroughly cleaned. Bone irregularities may be reshaped and bone regenerative material may be placed around my teeth. My gum will then be sutured back into position and a periodontal bandage or dressing may be placed.\n\nI further understand that unforeseen conditions may call for a modification or change from the anticipated surgical plan. These may include, but are not limited to:",
          "numbered": [
            "Extraction of decayed teeth to enhance healing of adjacent teeth.",
            "The removal of a decayed root of a multi-rooted tooth so as to preserve the tooth.",
            "Termination of the procedure prior to completion of all the surgery originally outlined."
          ]
        },
        {
          "heading": "Expected Benefits",
          "body": "The purpose of periodontal surgery is to reduce infection and inflammation and to restore my gum and bone. The surgery is intended to help me keep my teeth in the operated areas and to make my oral hygiene effective."
        },
        {
          "heading": "Principal Risks and Complications",
          "body": "I understand that a small number of patients do not respond successfully to periodontal surgery and in such cases, the involved teeth may eventually be lost. Periodontal surgery may not be successful in preserving function or appearance. Because each patient’s condition is unique, long-term success may not be possible.\n\nI understand that complications may result from the periodontal surgery, drugs or anesthetics.\n\nThese complications include, but are not limited to:",
          "items": [
            "post-surgical infection,",
            "bleeding,",
            "swelling and pain,",
            "facial discoloration,",
            "transient but on occasion permanent numbness of the jaw, lip, tongue, teeth, chin or gum (more likely with performing a connective tissue or free gingival grafting procedure),",
            "jaw joint injuries or associated muscle spasm,",
            "tooth sensitivity to hot, cold, sweet or acidic foods,",
            "shrinkage of the gum upon healing resulting in elongation of some teeth and greater spaces between some teeth,",
            "cracking or bruising of the corners of the mouth,",
            "restricted ability to open the mouth for few days or more,",
            "impact on speech,",
            "allergic reactions and",
            "accidental swallowing of foreign matter."
          ],
          "footer": "The exact duration of any complications cannot be determined and may be irreversible. There is no method that will accurately predict or evaluate how my gum and bone will heal. I understand that there may be a need for a second procedure if the initial results are not satisfactory.\n\nIn addition, the success of periodontal procedures can be affected by medical condition, dietary and nutritional problems, smoking, alcohol consumption, clenching and grinding of teeth, inadequate oral hygiene and medications that I may be taking.\n\nTo my knowledge, I have reported to my dentist any prior drug reactions, allergies, diseases, symptoms, habits or conditions that might in any way relate to this surgical procedure.\n\nI understand that taking care as recommended by my dentist and medications as prescribed is important to the ultimate success of the procedure."
        },
        {
          "heading": "Alternatives to Suggested Treatment",
          "body": "I understand that alternatives to periodontal surgery include:",
          "numbered": [
            "Possible advancement of my condition may result in premature loss of teeth.",
            "Extraction of teeth involved with periodontal disease.",
            "Non-surgical scraping of tooth roots and lining of the gum (scaling and root planing), with or without medication, in an attempt to further reduce bacteria and tartar under the gumline."
          ]
        },
        {
          "heading": "Necessary Follow-up Care and Self-Care",
          "body": "I understand that it is important for me to see my dentist on a regular basis. Existing restorative dentistry can be an important factor in the success or failure of periodontal therapy. From time to time, my dentist may make recommendations for the placement of restorations, the replacement or modification of existing restorations, the joining together of two or more of my teeth, the extraction of one or more teeth, the performance of root canal therapy or the movement of one, several or all of my teeth. I understand that the failure to follow such recommendations could lead to ill effects. I recognize that natural teeth and their artificial replacements should be maintained daily in a clean, hygienic manner. I will need to come for appointments following my surgery so that my healing may be monitored and my dentist can evaluate and report on the outcome of surgery upon completion of healing. Smoking or alcohol intake may adversely affect gum healing and may limit the successful outcome of my surgery.\n\nI know that it is important (1) to abide by the specific prescriptions and instructions given by the dentist and (2) to see my dentist for periodic examination and preventive treatment. Maintenance also may include adjustment of prosthetic appliances."
        },
        {
          "heading": "No Warranty or Guarantee",
          "body": "I hereby acknowledge that no guarantee, warranty or assurance has been given to me that the proposed treatment will be successful. In most cases, the treatment should provide benefit in reducing the cause of my condition and should produce healing which will help me keep my teeth. Due to individual patient differences, however, a dentist cannot predict certain success. There is a risk of failure, relapse, additional treatment or even worsening of my present condition, including the possible loss of certain teeth, despite the best of care."
        },
        {
          "heading": "Publication of Records",
          "body": "I authorize photos, slides, X-rays or any other viewings of my care and treatment during or after its completion to be used for the advancement of dentistry and reimbursement purposes. My identity will not be revealed to the general public without my permission."
        }
      ],
      "text": "On careful oral examination and study of my dental condition, {doctor} has advised me that I have periodontal (gum) disease. I understand that periodontal disease weakens support of my teeth and if untreated, can cause teeth loss and has other adverse consequences.\n\nMy dentist has recommended periodontal surgery ({procedure}) for the condition: {condition}. I understand that unforeseen conditions may call for a modification or change from the anticipated surgical plan.\n\nI hereby acknowledge that no guarantee, warranty or assurance has been given to me that the proposed treatment will be successful. There is a risk of failure, relapse, additional treatment or even worsening of my present condition, despite the best of care."
    },
    "pediatric": {
      "label": "Pediatric Dentistry Consent for Dental Procedures",
      "short": "Pediatric",
      "sections": [
        {
          "heading": null,
          "body": "It is the policy of this dental practice to inform parents of all procedures contemplated for your child. At each examination appointment, we will identify any dental treatment needed and describe this to you and your child.",
          "items": [
            "Each regular examination visit consists of oral hygiene instructions, cleaning of the teeth, topical application of fluoride, radiographs (X-rays) if needed and examination of the teeth, hard and soft tissues of the mouth and the bite.",
            "Any other treatment needed such as fillings, caps, extractions, etc. will be performed at a separate appointment after obtaining your permission."
          ],
          "footer": "Indian Law requires that we obtain your written informed consent for any treatment given to your child as a legal minor."
        },
        {
          "heading": null,
          "numbered": [
            "I hereby authorize and direct {doctor} assisted by other dentists and/or dental auxiliaries of his/her choice, to perform the following dental treatment or oral surgery procedures, including the use of any necessary or advisable local anesthesia, radiographs (X-rays) or diagnostic aids.",
            "In general terms the dental procedures or operation will include: Cleaning of the teeth and the application of topical fluoride. Application of plastic “sealants” to the grooves of the teeth. Treatment of the diseased or injured teeth with dental restoration (filling or caps). Replacement of missing teeth with dental prosthesis. Treatment of malposed (crooked) teeth and/or oral developmental or growth abnormalities.",
            "Use of local anesthesia, by injection, to numb the teeth worked on. Numbness usually lasts from 1½ to 3 hours. Allergic reactions are rare. Your child will be cautioned not to bite the numb lip and cheek. Please do not tell your child that they are going to get a “shot” as we have our special way of informing them about this.",
            "Nitrous Oxide (laughing gas) is used to relax children so that they feel less pain of the injection. This gas is placed over the child’s nose. Again, this gas is very safe. The nose piece, as with all treatment, will not be forced on the child."
          ],
          "footer": "I fully understand there is a possibility of surgical and/or medical complications developing during or after the procedure.\n\nI further authorize {doctor} to perform treatment to preserve the dental health of my child.\n\nI further understand that parents must remain in the reception area for the duration of their child's visit. However, for the initial visit, that parent will accompany the child to the consultation area. Upon completion of consultation, the parent will be requested to return to the reception area.\n\nI hereby state that I have read and understand this consent form and that all questions about the procedures have been answered in a satisfactory manner. I understand that I have a right to be provided with answers to questions which may arise during the course of my child's treatment.\n\nI further understand that this consent will remain in effect until such time that I choose to terminate it."
        },
        {
          "heading": "Behaviour Management Techniques",
          "body": "Among the behaviours that can interfere with the proper provision of quality dental care are: Hyperactivity, resistive movements, refusing to open the mouth or keep it open long enough to perform the necessary dental treatment and even aggressive or physical resistance to treatment, such as kicking, screaming and grabbing the dentist's hands or the sharp dental instruments.\n\nAll efforts will be made to obtain the cooperation of the child dental patients by the use of warmth, friendliness, persuasion, humour, charm, gentleness, kindness and understanding. There are several behaviour management techniques that are used by paediatric dentists to gain the cooperation of child-patients to eliminate disruptive behaviour or prevent them from causing injury to themselves due to uncontrollable movements. The more frequently used paediatric dentistry behaviour management techniques are as follows:\n\nTell-show-do: The dentist or assistant explains to the child what is to be done using simple terminology and repetition and then shows the child what is to be done by demonstrating with instruments on a model or the child's or dentist's finger. Then the procedure is performed in the child's mouth as described. Praise is used to reinforce cooperative behaviour.",
          "items": [
            "Positive reinforcement: This technique rewards the child who displays any behaviour which is desirable. Rewards include compliments.",
            "Voice control: The attention of a disruptive child is gained by changing the tone or increasing the volume of the dentist's voice. Content of the conversation is less important than the abrupt or sudden nature of a command.",
            "Mouth props: A rubber or plastic device is placed in the child's mouth to prevent closing when a child refuses or has difficulty maintaining an open mouth.",
            "Sedations: Sometimes drugs are used to relax a child who does not respond to other behaviour management techniques or who is unable to comprehend or cooperate for the dental procedures. These drugs may be administered orally, by injection or as a gas (nitrous oxide and oxygen). Your child will not be sedated without you being informed and obtaining your specific consent for such procedure.",
            "General anesthesia: The dentist performs the dental treatment with the child anesthetized in the hospital operating room. Your child will not be given general anesthesia without you being informed and obtaining your specific consent for such procedure."
          ]
        }
      ],
      "text": "It is the policy of this dental practice to inform parents of all procedures contemplated for your child. Indian Law requires that we obtain your written informed consent for any treatment given to your child as a legal minor.\n\nI hereby authorize and direct {doctor} assisted by other dentists and/or dental auxiliaries of his/her choice, to perform the following dental treatment or oral surgery procedures, including the use of any necessary or advisable local anesthesia, radiographs (X-rays) or diagnostic aids: {procedure}\n\nI fully understand there is a possibility of surgical and/or medical complications developing during or after the procedure. I further understand that this consent will remain in effect until such time that I choose to terminate it."
    },
    "orthodontic": {
      "label": "Orthodontic Consent and Information Form",
      "short": "Orthodontic",
      "sections": [],
      "text": "I understand the nature of orthodontic treatment, expected treatment duration, available alternatives, possible complications, follow-up needs, and self-care requirements. I confirm that I have had the opportunity to ask questions and that I consent to proceed with treatment as advised by the doctor.\n\nI, the patient/guardian/assistant, understand the nature of dental braces treatment, methods involved, available alternative options, procedures, approximate timeline, expected benefits, possible challenges, follow-up actions, and the importance of self-care. The doctor has informed me about the need to attend appointments regularly and maintain oral hygiene during and after treatment.\n\nI understand that the matters described below should be taken into consideration, and that rare complications or difficulties may occasionally occur. I have had the opportunity to ask questions and clarify doubts.\n\n- I understand that, if required as part of treatment, teeth may need to be extracted.\n- If oral hygiene is not properly maintained during treatment, gum disease and tooth decay may occur. I have been advised to use specific toothpaste/mouthwash and proper orthodontic brushing technique.\n- Damaged or decayed teeth may become non-vital over time, either related or unrelated to orthodontic treatment. If cavities are not restored, they may worsen.\n- Teeth may develop pain/discomfort during treatment. If instructions are not followed, appliances may cause oral ulcers; medication/gel may be needed.\n- Growth pattern, patient cooperation, and appliance use can increase treatment duration. Missed appointments may prolong treatment time.\n- Rarely, patients may experience jaw-joint pain, accidental swallowing of appliance parts, tooth mobility, or material allergy.\n- Food trapped between braces and teeth can cause discoloration, surface damage, and decay. Dietary control is needed during treatment. Post-treatment whitening may be done with separate charges.\n- If braces are removed early, relapse may occur. To maintain results, removable or fixed retainers may need to be worn long-term as advised, with additional cost.\n- Monthly treatment payments are required. Lost/damaged brackets may incur additional charges.\n- With growth and aging, minor future position changes may occur, especially in front teeth; retreatment or surgery may be needed in selected cases.\n\nIn case of inadequate patient cooperation, the doctor has full authority to terminate treatment. The doctor/institution is not responsible for consequences arising from non-cooperation.\n\nI consent to use of photographs, X-rays, study models, and related records for research, teaching, and publication. If I discontinue treatment midway for personal reasons, I remain liable to pay the full treatment amount.\n\nI certify that the orthodontic treatment plan, methods, and possible outcomes have been explained to me in a clear manner and I provide my full informed consent."
    },
    "prosthodontic": {
      "label": "Prosthodontic Consent (Crown / Bridge / Denture)",
      "short": "Prosthodontic",
      "sections": [
        {
          "heading": null,
          "body": "I understand the treatment plan for crown / bridge / removable or complete denture and available alternatives."
        },
        {
          "heading": "Important Points",
          "items": [
            "Multiple appointments and adjustments may be required for best fit and comfort.",
            "Speech and chewing adaptation period is expected after new prosthesis.",
            "Periodic review and maintenance are required, including possible relining/repair/recementation.",
            "Failure to maintain oral hygiene and follow-up can lead to gum/tooth complications."
          ]
        },
        {
          "heading": "Consent",
          "body": "I have understood the benefits, limitations and maintenance needs, and I consent to proceed with {procedure} as advised by {doctor}."
        }
      ],
      "text": "I understand the prosthodontic treatment plan, alternatives, maintenance needs and possible adjustments over time. I consent to proceed with {procedure} for {condition} as advised by {doctor}."
    },
    "pulpectomy": {
      "label": "Pulpectomy Treatment Consent",
      "short": "Pulpectomy",
      "sections": [],
      "text": "I have been fully informed of the nature of the PULPECTOMY procedure to conserve the tooth, the procedure to be utilized, the risks and the benefits of the procedure, the selected Anaesthesia, alternative treatments available, the approximate treatment cost and the need for regular follow up and self-care have been explained.\n\nI have had an opportunity to ask any questions that I have in connection with the treatment and to discuss my concerns with the Doctor. The necessity of crown for a successful pulpectomy, adverse effects of the SELECTED ANAESTHETIC PROCEDURE and the complications that one can expect or may happen during or after pulpectomy procedure have been explained to me.\n\nI hereby consent to procedure of PULPECTOMY as presented to me during consultation and the treatment plan as described. I hereby certify that I have read and fully understand this consent."
    },
    "crown": {
      "label": "Crown (Stainless Steel / Tooth Colored) Treatment Consent",
      "short": "Crown",
      "sections": [],
      "text": "I have been fully informed of the nature of the placement of CROWN procedure to maintain and protect the tooth, the procedure to be utilized, the risks and the benefits of the procedure, the selected Anaesthesia, alternative treatments available, the approximate treatment cost and the need for regular follow up and self-care have been explained.\n\nI have had an opportunity to ask any questions that I have in connection with the treatment and to discuss my concerns with the Doctor. The adverse effects of the SELECTED ANAESTHETIC PROCEDURE and the complications that one can expect or may happen during or after crown procedure including crown decementation have been explained to me.\n\nI hereby consent to procedure of CROWN (STAINLESS STEEL / TOOTH COLORED) as presented to me during consultation and the treatment plan as described. I hereby certify that I have read and fully understand this consent."
    },
    "rpd_cd_crown_bridge": {
      "label": "Consent For RPD/CD/Crown/Fixed Bridge Treatment",
      "short": "RPD/CD/Crown/Bridge",
      "sections": [],
      "text": "I understand the nature of RPD (Removable Partial Denture), CD (Complete Denture), Crown, and Fixed Bridge treatment, including available alternatives, expected timeline, benefits, possible difficulties, follow-up requirements, and self-care responsibilities.\n\nI have had the opportunity to ask questions and clarify doubts. I understand that complications may occur in rare situations, and I consent to proceed with full awareness.\n\nI understands the nature of the RPD, CD, CROWN, and FIXED BRIDGE treatment, the methods involved, available alternative options, procedures, approximate timeline, benefits, potential challenges, follow-up actions, and the necessity for self-care. The doctor has informed me about the importance of attending treatment appointments accurately and maintaining oral hygiene during and after treatment.\n\nI understand that the matters described herein should be considered carefully, and that there may occasionally be rare complications or difficulties. I have had the opportunity to ask questions and seek clarification of doubts.\n\nTooth/teeth that were badly damaged and could not be maintained, or could have been saved by root canal/gum surgery, have been removed as per my request.\n\nUnderstanding the necessity of replacing missing teeth and the disadvantages of not doing so, I am proceeding with denture placement with full consent.\n\nI understand that after extraction, gum healing usually takes approximately 45 to 90 days, and denture placement is ideal after this period. The doctor has explained the side effects of placing dentures earlier than this period.\n\nIn cases where all teeth are removed, healing can take up to three months. During this period, gum-massage technique has been explained. I understand that sometimes, even after healing, bone may remain sharp and minor surgery may be needed if massage does not resolve it. I also understand dentures can become loose quickly if placed before complete healing, and in some cases a new denture set may be required.\n\nI have understood different types of artificial teeth, their advantages and disadvantages, and approximate cost. I have selected my preferred set based on my own choice.\n\nOver time, removable dental sets may become loose due to bone resorption. Newly fitted dentures may cause pain or sores and may require multiple adjustment visits. The doctor has explained that speaking/eating difficulties can occur initially and improve only with continuous use.\n\nThe doctor has explained denture-use instructions and care points, including six-monthly check-ups. I understand the set may change or wear over time.\n\nFor fixed teeth (bridge), I understand adjacent teeth may need trimming and the missing tooth is connected with crowns on neighboring teeth. If support teeth have decay/gum disease, root canal treatment may be needed first; otherwise sensitivity or pain may occur early.\n\nThe doctor has explained maintenance after bridge/root canal/crown treatment, including self-care (mouthwash, flossing, brushing) and periodic cleaning every six months. I understand that poor maintenance can cause food impaction, gum disease, loosening, and damage to neighboring/supporting teeth.\n\nI understand that biting excessively hard objects can crack or dislodge the crown/ceramic, and caps may loosen over time.\n\nI understand all above points and provide full consent for RPD, CD, CROWN, and FIXED BRIDGE treatment."
    }
  },
  "ml": {
    "general": {
      "title": "ജനറൽ ദന്തചികിത്സ സമ്മതപത്രം",
      "sections": [],
      "text": "എന്റെ ദന്താരോഗ്യവുമായി ബന്ധപ്പെട്ട നിലവിലെ അവസ്ഥ ({condition}), നിർദ്ദേശിച്ച ചികിത്സ ({procedure}), ഗുണഫലങ്ങൾ, അപകടസാധ്യതകൾ, ബദൽ ചികിത്സാമാർഗങ്ങൾ എന്നിവയെക്കുറിച്ച് ഡോക്ടർ {doctor} വ്യക്തമായി വിശദീകരിച്ചു.\n\nചികിത്സയ്ക്കിടെ പ്രതീക്ഷിക്കാത്ത ക്ലിനിക്കൽ സാഹചര്യം കണ്ടെത്തുകയാണെങ്കിൽ ചികിത്സാ പദ്ധതി ആവശ്യാനുസരണം മാറ്റേണ്ടതായി വരാമെന്ന് ഞാൻ മനസ്സിലാക്കുന്നു.\n\nഎനിക്ക് സംശയങ്ങൾ ചോദിക്കാനുള്ള അവസരം ലഭിച്ചു. ലഭിച്ച മറുപടികളിൽ ഞാൻ തൃപ്തനാണ്/തൃപ്തയാണ്. നിർദ്ദേശിച്ച ചികിത്സയ്ക്ക് ഞാൻ സ്വമേധയാ സമ്മതിക്കുന്നു."
    },
    "endodontic": {
      "title": "റൂട്ട് കനാൽ ചികിത്സ സമ്മതപത്രം",
      "sections": [],
      "text": "എന്നോട് റൂട്ട് കനാൽ/ വേര് ചികിത്സ ചെയ്യേണ്ടതാണെന്ന് ദന്ത രോഗ വിദഗ്ധൻ വിശദീകരിച്ചിട്ടുണ്ട്. റൂട്ട് കനാൽ ചികിത്സ എന്നത്, സാധാരണ രീതിയിൽ അടച്ചു സംരക്ഷിക്കാൻ സാധിക്കാത്ത/ എടുക്കേണ്ട പല്ലിനെ സംരക്ഷിക്കാൻ നടത്തുന്ന ചികിത്സയാണ്. ഈ ചികിത്സയ്ക്ക് നല്ല വിജയശതമാനം ഉണ്ടായാലും, മറ്റേതു ദന്ത ചികിത്സകളെപ്പോലെ തന്നെ ഫലത്തെക്കുറിച്ച് ഉറപ്പുകൾ ഒന്നും നൽകാൻ സാധിക്കുകയില്ല. കൂടാതെ റൂട്ട് കനാൽ ചികിത്സ ഇപ്പോൾ ഉള്ള/ അല്ലെങ്കിൽ ഉണ്ടാകാനിടയുള്ള ഒരു പ്രശ്നത്തെ പരിഹരിക്കുന്നതിനാണ്, ഭാവിയിൽ ഈ പല്ലിന് പ്രശ്നങ്ങൾ ഉണ്ടാകുന്നതിനെ പ്രതിരോധിക്കാൻ സാധിക്കുകയില്ല. ചില സമയങ്ങളിൽ വീണ്ടും ചികിത്സ ചെയ്യുകയോ, ആവശ്യമെങ്കിൽ സർജറി ചെയ്യുകയോ പല്ല് തന്നെ നീക്കം ചെയ്യേണ്ടതായി വരാം എന്നിവയും, താഴെ പറഞ്ഞവ കൂടാതെയുള്ള മറ്റു പാർശ്വഫലങ്ങളും ഉണ്ടാകാനിടയുണ്ടെന്ന് ഞാൻ മനസിലാക്കുന്നു.\n\nചികിത്സ നടപടിയുമായി ബന്ധപ്പെട്ടും, അനസ്തേഷ്യ മൂലമോ ഉണ്ടാകാവുന്ന അപൂർവ അപകടസാധ്യതകളെക്കുറിച്ചും എന്നോട് വിശദീകരിച്ചിട്ടുണ്ട്.\n- റൂട്ട് കനാൽ ചികിത്സയ്ക്ക് ഉപയോഗിക്കുന്ന മരുന്നുകളോ ഫില്ലിംഗ് പദാർത്ഥങ്ങളോ ശരീരത്തിൽ പാർശ്വഫലങ്ങൾ ഉണ്ടാക്കാം.\n- ചികിത്സ സമയത്ത് പല്ലിനുള്ളിൽ ഉപയോഗിക്കുന്ന ചില ഉപകരണങ്ങളോ വസ്തുക്കളോ ഒടിഞ്ഞ് പോകുകയോ അബദ്ധത്തിൽ വിഴുങ്ങിപ്പോകുകയോ ചെയ്യാം.\n- വായ് തുറക്കുന്നതിൽ ബുദ്ധിമുട്ട് ഉണ്ടെങ്കിൽ അതിനായി കൂടുതൽ ചികിത്സ ആവശ്യമായി വരാം.\n- റൂട്ട് കനാൽ ചെയ്ത പല്ലിൽ പൊട്ടൽ, പല്ലിന്റെ ഭാഗങ്ങൾക്ക് ഇളക്കം, വേരിനുള്ളിൽ തുള (പെർഫറേഷൻ), അല്ലെങ്കിൽ കനാലിനെ തടസ്സപ്പെടുത്തുന്ന വസ്തുക്കൾ ഉണ്ടാകൽ പോലുള്ള ബുദ്ധിമുട്ടുകൾ ഉണ്ടാകാം.\n- പല്ലിന്റെ വേരിന്റെ അടിഭാഗത്ത് ഉള്ള അണുബാധ ഭേദമാകാതിരിക്കുകയോ, പെുപ്പ് രൂപപ്പെടുകയോ ചെയ്താൽ മരുന്ന് കഴിക്കേണ്ടി വരാം; ആവശ്യമായാൽ ശസ്ത്രക്രിയയോ പല്ല് നീക്കം ചെയ്യലോ വേണ്ടിവരും.\n- പല്ലുകളുടെ സമീപമുള്ള ഞരമ്പുകൾക്ക് ക്ഷതം സംഭവിക്കാമെന്നും, അതിനാൽ താടി, ചുണ്ട്, കവിൾ, മോണ, നാവ് എന്നിവിടങ്ങളിൽ വേദന, മരവിപ്പ്, കടിച്ചിൽ, അല്ലെങ്കിൽ മറ്റ് അസ്വസ്ഥതകൾ ഉണ്ടാകാമെന്നും, അത് ആഴ്ചകളോളം, മാസങ്ങളോളം, അപൂർവമായി സ്ഥിരമായും തുടരാമെന്നും ഞാൻ മനസ്സിലാക്കുന്നു.\n- റൂട്ട് കനാൽ ചികിത്സയ്ക്ക് ശേഷം ഒരു മാസത്തിനകം പല്ലിന് ക്യാപ്/ക്രൗൺ ചികിത്സയോ പ്രത്യേക ഫില്ലിങ്ങുകളോ ചെയ്യേണ്ടത് നിർബന്ധമാണെന്ന് എനിക്ക് അറിയിച്ചിട്ടുണ്ട്. അത് ചെയ്തില്ലെങ്കിൽ പല്ല് പൊട്ടിപ്പോകാനും, ചികിത്സ ഫലപ്രദമാകാതിരിക്കാനും സാധ്യതയുണ്ടെന്ന് ഞാൻ മനസ്സിലാക്കുന്നു.\n\nചികിത്സയുമായി ബന്ധപ്പെട്ട ചോദ്യങ്ങൾ ചോദിക്കാനും, എന്റെ ആശങ്കകൾ ഡോക്ടറുമായി ചർച്ച ചെയ്യാനും എനിക്ക് അവസരം ലഭിച്ചിട്ടുണ്ട്. തിരഞ്ഞെടുക്കപ്പെട്ട അനസ്തേഷ്യ രീതിയുടെ പാർശ്വഫലങ്ങളും, റൂട്ട് കനാൽ ചികിത്സയ്ക്കിടെയോ ചികിത്സയ്ക്ക് ശേഷമോ ഉണ്ടാകാവുന്ന കോംപ്ലിക്കേഷനുകളും എന്നോട് വിശദീകരിച്ചിട്ടുണ്ട്.\n\nകൺസൾട്ടേഷനിൽ എനിക്ക് അവതരിപ്പിച്ച ചികിത്സാരീതി, ചികിത്സാ പദ്ധതി എന്നിവ മനസ്സിലാക്കി ഞാൻ ഈ ചികിത്സയ്ക്ക് സമ്മതം നൽകുന്നു. ഈ സമ്മതപത്രം ഞാൻ വായിക്കുകയും പൂർണ്ണമായി മനസ്സിലാക്കുകയും ചെയ്തതായി ഇതുവഴി സാക്ഷ്യപ്പെടുത്തുന്നു."
    },
    "oral_surgery": {
      "title": "ഓറൽ സർജറി / പല്ല് നീക്കം ചെയ്യൽ സമ്മതപത്രം",
      "sections": [],
      "text": "നിർദ്ദേശിച്ച ശസ്ത്രക്രിയയുടെ സ്വഭാവം, അനസ്‌തീഷ്യ ഓപ്ഷനുകൾ, ബദൽ മാർഗങ്ങൾ എന്നിവ ഡോക്ടർ വിശദീകരിച്ചു.\n\nവേദന, വീക്കം, രക്തസ്രാവം, ഡ്രൈ സോക്കറ്റ്, വായ് തുറക്കുന്നതിലെ ബുദ്ധിമുട്ട്, അപൂർവമായി നാഡീസംബന്ധമായ മന്ദത എന്നിവ സാധ്യതയുള്ള അപകടങ്ങളാണെന്ന് ഞാൻ മനസ്സിലാക്കുന്നു.\n\nചില അപൂർവ സാഹചര്യങ്ങളിൽ കൂടുതൽ ചികിത്സയോ വിദഗ്ധ റഫറലോ ആവശ്യമാകാമെന്ന് അറിയാം. നിർദ്ദേശിച്ച {procedure} ചികിത്സയ്ക്ക് ഞാൻ സമ്മതിക്കുന്നു."
    },
    "implants": {
      "title": "ഡെന്റൽ ഇംപ്ലാന്റ് ചികിത്സ",
      "sections": [],
      "text": "എന്റെ നഷ്ടപ്പെട്ടതോ കേടായതോ ആയ പല്ല് മാറ്റിസ്ഥാപിക്കുന്നതിനുള്ള ഡെന്റൽ ഇംപ്ലാന്റ് ശസ്ത്രക്രിയയും, പ്രോസ്തെറ്റിക് പ്ലേസ്മെന്റ് പ്രക്രിയയും ചെയ്യുന്നതിനുള്ള ശസ്ത്രക്രിയയുടെ സ്വഭാവം, ഉദ്ദേശിക്കുന്ന ചികിത്സാരീതി, അതിന്റെ നടപടിക്രമം, അപകടസാധ്യതകളും നേട്ടങ്ങളും, ചികിത്സയുടെ സമയക്രമം, തിരഞ്ഞെടുത്ത അനസ്തേഷ്യയും, ലഭ്യമായ ബദൽ ചികിത്സകളും, തുടർനടപടികളുടെയും, സ്വയംപരിചരണത്തിന്റെ ആവശ്യകതയെക്കുറിച്ചും എന്നെ പൂർണ്ണമായി അറിയിച്ചിട്ടുണ്ട്.\n\nചികിത്സയെ സംബന്ധിച്ച സംശയങ്ങൾ ചോദിക്കാനും, എന്റെ ആശങ്കകൾ ഡോക്ടറുമായി ചർച്ച ചെയ്യാനും എനിക്ക് അവസരം ലഭിച്ചിട്ടുണ്ട്. തിരഞ്ഞെടുത്ത അനസ്തേഷ്യ മൂലം ഉണ്ടാകാവുന്ന കോംപ്ലിക്കേഷൻസും പാർശ്വഫലങ്ങളും, ഡെന്റൽ ഇംപ്ലാന്റ് ശസ്ത്രക്രിയയും, പ്രോസ്തെറ്റിക് പ്ലേസ്മെന്റ് പ്രക്രിയയും, അതിന്റെ സർജിക്കൽ കോംപ്ലിക്കേഷൻസും, ഏകദേശ ചിലവും എന്നോട് വിവരിച്ചിട്ടുണ്ട്.\n\nകൺസൾട്ടേഷനിൽ എനിക്ക് അവതരിപ്പിച്ച ഡെന്റൽ ഇംപ്ലാന്റ് ശസ്ത്രക്രിയയും, പ്രോസ്തെറ്റിക് പ്ലേസ്മെന്റ് പ്രക്രിയയും, അതിന്റെ സമയക്രമം ഉൾപ്പെടെ എനിക്ക് വിവരിച്ചു തന്ന പ്രകാരം, ഞാൻ ഇതിനാൽ സമ്മതിക്കുന്നു."
    },
    "periodontal": {
      "title": "പെരിയോഡോണ്ടൽ ശസ്ത്രക്രിയ സമ്മതപത്രം",
      "sections": [],
      "text": "ഗം/പെരിയോഡോണ്ടൽ രോഗാവസ്ഥയുടെ ഗുരുത്വവും ചികിത്സയുടെ ആവശ്യകതയും എനിക്ക് വിശദീകരിച്ചു.\n\nചികിത്സയ്ക്കുശേഷം വേദന, വീക്കം, സെൻസിറ്റിവിറ്റി, പല്ലുകൾക്കിടയിലെ ഇടവേള മാറ്റങ്ങൾ, ചിലപ്പോള്‍ ദീർഘകാല അസ്വസ്ഥതകൾ ഉണ്ടാകാം എന്ന് ഞാൻ മനസ്സിലാക്കുന്നു.\n\nചികിത്സയുടെ വിജയത്തിൽ സ്വയംപരിപാലനം, പുകവലി/മദ്യം ഒഴിവാക്കൽ, സ്ഥിരമായ ഫോളോ-അപ്പ് എന്നിവ നിർണായകമാണെന്ന് എനിക്ക് അറിയാം."
    },
    "pediatric": {
      "title": "കുട്ടികളുടെ ദന്തചികിത്സ സമ്മതപത്രം",
      "sections": [],
      "text": "ഞാൻ കുട്ടിയുടെ രക്ഷിതാവ്/നിയമപരമായ സംരക്ഷകനാണ്. നിർദ്ദേശിച്ച ചികിത്സയുടെ സ്വഭാവം, അപകടസാധ്യതകൾ, അനസ്‌തീഷ്യയും പെരുമാറ്റ നിയന്ത്രണ മാർഗങ്ങളും എനിക്ക് വിശദീകരിച്ചു.\n\nചികിത്സയ്ക്കിടെ അല്ലെങ്കിൽ ശേഷമോ ചില അപൂർവ മെഡിക്കൽ/ശസ്ത്രക്രിയാ പ്രശ്നങ്ങൾ ഉണ്ടായേക്കാമെന്ന് ഞാൻ മനസ്സിലാക്കുന്നു.\n\nഎന്റെ കുട്ടിയുടെ ദന്താരോഗ്യം സംരക്ഷിക്കാൻ നിർദ്ദേശിച്ച {procedure} ചികിത്സയ്ക്ക് ഞാൻ സമ്മതം നൽകുന്നു."
    },
    "orthodontic": {
      "title": "ദന്തക്രമീകരണ ചികിത്സ സമ്മതപത്രം",
      "sections": [
        {
          "items": [
            "ചികിത്സയുടെ ഭാഗമായി പല്ലുകൾ ആവശ്യമെങ്കിൽ എടുത്തേക്കേണ്ടതായി വരാം എന്ന് ഞാൻ മനസ്സിലാക്കുന്നു.",
            "ചികിത്സാകാലയളവിൽ ദന്തശുചിത്വം കൃത്യമായി പാലിച്ചില്ലെങ്കിൽ മോണരോഗവും ദന്തക്ഷയവും ഉണ്ടാകാൻ സാധ്യതയുണ്ട്. പ്രത്യേക പേസ്റ്റുകളും മൗത്ത് വാഷുകളും ഉപയോഗിക്കേണ്ടതിനെക്കുറിച്ചും, ഓർത്തോ ടൂത്ത് ബ്രഷ് ശരിയായി ഉപയോഗിക്കുന്ന രീതിയും ഡോക്ടർ പഠിപ്പിച്ചിട്ടുണ്ട്.",
            "ക്ഷതം/ക്ഷയം സംഭവിച്ച പല്ലുകൾ കാലക്രമേണ നിർജീവമാകാൻ സാധ്യതയുണ്ട്. ഇത് ചികിത്സ മൂലമോ അല്ലാതെയോ സംഭവിക്കാം. ക്ഷയം അടച്ചില്ലെങ്കിൽ അത് വലുതാകാം എന്ന് അറിയിച്ചിട്ടുണ്ട്.",
            "ചികിത്സയുടെ ഭാഗമായി പല്ലുകൾക്ക് വേദന/അസ്വസ്ഥത ഉണ്ടാകാം. ഡോക്ടറുടെ നിർദേശങ്ങൾ കൃത്യമായി പാലിക്കാത്ത പക്ഷം അപ്ലയൻസുകൾ മൂലം വായ്ക്കുള്ളിൽ മുറിവുകൾ ഉണ്ടാകാം. അത്തരം സാഹചര്യത്തിൽ മരുന്ന്/ജെൽ ഉപയോഗിക്കണമെന്ന് നിർദേശിച്ചിട്ടുണ്ട്.",
            "ഓരോ വ്യക്തിയുടെയും വളർച്ചാനിരക്ക്, ചികിത്സയോടുള്ള സഹകരണം, അപ്ലയൻസുകളുടെ ഉപയോഗരീതി എന്നിവ ചികിത്സാദൈർഘ്യം കൂടാൻ കാരണമാകാം. നിർദേശിച്ച ദിവസങ്ങളിൽ ചികിത്സ തുടരാത്ത പക്ഷം കാലാവധി കൂടും.",
            "അപൂർവമായി ചിലർക്കു താടി-സന്ധി വേദന, അപ്ലയൻസ് ഭാഗങ്ങൾ വിഴുങ്ങിപ്പോവുക, പല്ലുകൾക്ക് ഇളക്കം, ചികിത്സാ മെറ്റീരിയലുകളോട് അലർജി എന്നിവ ഉണ്ടാകാം.",
            "ഭക്ഷണം പല്ലുകളും ബ്രാക്കറ്റുകളും ഇടയിൽ കുടുങ്ങിയാൽ നിറംമാറ്റം, ഉപരിതല തകരാർ, ദന്തക്ഷയം എന്നിവ ഉണ്ടാകാം. ചികിത്സാകാലത്ത് ഭക്ഷണക്രമത്തിൽ ശ്രദ്ധ വേണം. ചികിത്സയ്ക്ക് ശേഷം ആവശ്യമെങ്കിൽ Tooth Whitening ചെയ്യാം; അതിന് പ്രത്യേക ഫീസ് ഉണ്ടായിരിക്കും.",
            "ചികിത്സ പൂർത്തിയാകുന്നതിന് മുമ്പ് ബ്രേസുകൾ നീക്കിയാൽ റിലാപ്സ് (പഴയ അവസ്ഥയിലേക്കുള്ള മാറ്റം) ഉണ്ടാകാം. ചികിത്സയ്ക്ക് ശേഷം പല്ലുകളുടെ സ്ഥാനം നിലനിർത്താൻ removable അല്ലെങ്കിൽ fixed retainer ഡോക്ടറുടെ നിർദേശപ്രകാരം ദീർഘകാലം ധരിക്കണം; അതിന് അധിക ചെലവ് ഉണ്ടായേക്കാം. ശരിയായി ധരിക്കാത്ത പക്ഷം റിലാപ്സ് വേഗത്തിൽ ഉണ്ടാകാം.",
            "എല്ലാ മാസവും നിശ്ചിത തുക അടയ്ക്കണം. ബ്രാക്കറ്റുകൾ നഷ്ടപ്പെട്ടാൽ വീണ്ടും ഒട്ടിക്കാൻ അധിക തുക അടയ്ക്കണം.",
            "പ്രായവളർച്ചയും താടി/എല്ല് വളർച്ചാമാറ്റങ്ങളും മൂലം, പ്രത്യേകിച്ച് മുൻനിര പല്ലുകളിൽ, പിന്നീടും ചെറിയ സ്ഥാനംമാറ്റങ്ങൾ ഉണ്ടാകാം. അത് ശരിയാക്കാൻ വീണ്ടും fixed orthodontic treatment അല്ലെങ്കിൽ ചിലപ്പോൾ ശസ്ത്രക്രിയ ആവശ്യമായി വരാം."
          ],
          "footer": "രോഗിയുടെ പൂർണ്ണ സഹകരണം ഇല്ലാത്ത സാഹചര്യത്തിൽ ചികിത്സ അവസാനിപ്പിക്കാൻ ഡോക്ടർക്ക് പൂർണ്ണ അധികാരമുണ്ട്. അതിനാൽ ഉണ്ടാകുന്ന പ്രശ്നങ്ങൾക്ക് ഡോക്ടർ/സ്ഥാപനം ഉത്തരവാദികളല്ല.\n\nഎന്റെ ഫോട്ടോഗ്രാഫുകൾ, എക്സ്-റേകൾ, സ്റ്റഡി മോഡലുകൾ, മറ്റ് വിവരങ്ങൾ എന്നിവ ഗവേഷണം, പഠനം, പ്രസിദ്ധീകരണം എന്നിവയ്ക്കായി ഉപയോഗിക്കുന്നതിന് ഞാൻ സമ്മതം നൽകുന്നു. വ്യക്തിപരമായ കാരണങ്ങളാൽ ചികിത്സ പാതിവഴിയിൽ നിർത്തുകയാണെങ്കിൽ മുഴുവൻ തുകയും അടയ്ക്കേണ്ട ബാധ്യത എനിക്ക് ഉണ്ടെന്ന് ഞാൻ മനസ്സിലാക്കുന്നു.\n\nദന്തക്രമീകരണ ചികിത്സാവിധികളും അതിന്റെ അനന്തരഫലങ്ങളും എനിക്ക് വ്യക്തമായി വിശദീകരിച്ചിട്ടുണ്ടെന്ന് ഞാൻ സാക്ഷ്യപ്പെടുത്തുന്നു. മുകളിൽ പറഞ്ഞതെല്ലാം മനസ്സിലാക്കി, നിർദേശിച്ച രീതിയിൽ ഓർത്തോഡോന്റിക് ചികിത്സ തുടരാൻ ഞാൻ പൂർണ്ണ സമ്മതം നൽകുന്നു."
        }
      ],
      "text": "ഞാൻ / എന്റെ രോഗിയുടെ രക്ഷിതാവ്/സഹായി, പല്ല് തെറ്റുന്ന ചികിത്സയുടെ സ്വഭാവം, രീതി, ലഭ്യമായ ബദൽ മാർഗങ്ങൾ, നടപടിക്രമങ്ങൾ, ഏകദേശ സമയം, നേട്ടങ്ങൾ, വരാൻ സാധ്യതയുള്ള ബുദ്ധിമുട്ടുകൾ, തുടർനടപടികൾ, സ്വയം പരിചരണത്തിന്റെ ആവശ്യകത എന്നിവ മനസ്സിലാക്കുന്നു. ചികിത്സയുടെ അപ്പോയിന്റ്മെന്റുകൾ കൃത്യമായി ശ്രദ്ധിക്കൽ, ചികിത്സയ്ക്കിടെയും ശേഷവും വായുടെ ശുചിത്വം പാലിക്കേണ്ടതിന്റെ പ്രാധാന്യം എന്നിവയെപ്പറ്റി എനിക്ക് ഡോക്ടർ പറഞ്ഞു തന്നിട്ടുണ്ട്.\n\nതാഴെ വിവരിച്ചിട്ടുള്ള കാര്യങ്ങൾ ശ്രദ്ധിക്കണം എന്നും, അപൂർവമായി ബുദ്ധിമുട്ടുകൾ ഉണ്ടാകാമെന്നും ഞാൻ മനസ്സിലാക്കുന്നു. ചികിത്സയുമായി ബന്ധപ്പെട്ട ചോദ്യങ്ങൾ ചോദിക്കാനും, സംശയദൂരീകരണത്തിനും എനിക്ക് അവസരം ലഭിച്ചിട്ടുണ്ട്."
    },
    "prosthodontic": {
      "title": "ക്രൗൺ / ബ്രിഡ്ജ് / ഡെഞ്ചർ സമ്മതപത്രം",
      "sections": [
        "ക്രൗൺ, ബ്രിഡ്ജ്, ഭാഗിക/പൂർണ്ണ കൃത്രിമ പല്ലുകൾ എന്നിവയുടെ ഗുണദോഷങ്ങളും ബദൽ മാർഗങ്ങളും എനിക്ക് വിശദീകരിച്ചു.",
        "പുതിയ പ്രോസ്തീസിസ് ഉപയോഗത്തിന്റെ തുടക്കത്തിൽ സംസാരിക്കലിലും ഭക്ഷണം കഴിക്കലിലും അസൗകര്യം ഉണ്ടാകാം. ഫിറ്റ് മെച്ചപ്പെടുത്താൻ അധിക സന്ദർശനങ്ങൾ ആവശ്യമായി വരാം.",
        "കാലക്രമേണ റിപയർ, റീലൈനിംഗ്, റീസിമെന്റേഷൻ, പുനഃക്രമീകരണം എന്നിവ ആവശ്യമായി വരാം. നിർദ്ദേശിച്ച ശുചിത്വവും ഫോളോ-അപ്പും പാലിക്കുമെന്ന് ഞാൻ ഉറപ്പുനൽകുന്നു."
      ]
    },
    "pulpectomy": {
      "title": "പൾപെക്ടമി ചികിത്സാ സമ്മതപത്രം",
      "sections": [],
      "text": "എന്റെ കുട്ടിയുടെ രക്ഷിതാവ്/സംരക്ഷകൻ ആയ എന്നോട് പല്ല് സംരക്ഷിക്കുന്നതിനുള്ള പൾപെക്ടമി ചികിത്സയുടെ സ്വഭാവം, ഉപയോഗിക്കുന്ന ചികിത്സാരീതി, അതിന്റെ നടപടിക്രമം, അപകടസാധ്യതകളും നേട്ടങ്ങളും, തിരഞ്ഞെടുത്ത അനസ്തേഷ്യയും, ലഭ്യമായ ബദൽ ചികിത്സകളും, ഏകദേശ ചെലവും, തുടർനടപടികളുടെയും സ്വയംപരിചരണത്തിന്റെയും ആവശ്യകതയെക്കുറിച്ചും എന്നെ പൂർണ്ണമായി അറിയിച്ചിട്ടുണ്ട്.\n\nചികിത്സയുമായി ബന്ധപ്പെട്ട് ചോദ്യങ്ങൾ ചോദിക്കാനും, എന്റെ ആശങ്കകൾ ഡോക്ടറുമായി ചർച്ച ചെയ്യാനും എനിക്ക് അവസരം ലഭിച്ചിട്ടുണ്ട്. പൾപെക്ടമിക്ക് ശേഷം ക്രൗൺ വെക്കേണ്ട ആവശ്യകതയെപ്പറ്റിയും, തിരഞ്ഞെടുത്ത അനസ്തേഷ്യ മൂലം ഉണ്ടാകാവുന്ന കോംപ്ലിക്കേഷൻസും പാർശ്വഫലങ്ങളും, പൾപെക്ടമി ചികിത്സയുടെ കോംപ്ലിക്കേഷൻസും എന്നോട് വിവരിച്ചിട്ടുണ്ട്.\n\nകൺസൾട്ടേഷനിൽ എനിക്ക് അവതരിപ്പിച്ച പൾപെക്ടമി ചികിത്സാരീതിക്കും എനിക്ക് വിവരിച്ച ചികിത്സാപദ്ധതി പ്രകാരം ഞാൻ ഇതിനാൽ സമ്മതിക്കുന്നു. ഈ സമ്മതപത്രം ഞാൻ വായിക്കുകയും പൂർണ്ണമായി മനസ്സിലാക്കുകയും ചെയ്തുവെന്ന് ഞാൻ ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു."
    },
    "crown": {
      "title": "ക്രൗൺ (സ്റ്റീൽ/ പല്ലിന്റെ നിറം) ചികിത്സാ സമ്മതപത്രം",
      "sections": [],
      "text": "ഞാൻ / എന്റെ രോഗിയുടെ രക്ഷിതാവ് / സഹായിയായി, പല്ല് സംരക്ഷിക്കുന്നതിനുള്ള ക്രൗൺ ചികിത്സയുടെ സ്വഭാവം, ഉപയോഗിക്കുന്ന ചികിത്സാരീതി അതിന്റെ നടപടിക്രമം അപകടസാധ്യതകളും നേട്ടങ്ങളും, തിരഞ്ഞെടുത്ത അനസ്തേഷ്യയും, ലഭ്യമായ ബദൽ ചികിത്സകളും, ഏകദേശ ചിലവും, തുടർനടപടികളുടെയും, സ്വയം പരിചരണത്തിന്റ ആവശ്യകതയെക്കുറിച്ചും എന്നെ പൂർണ്ണമായി അറിയിച്ചിട്ടുണ്ട്.\n\nചികിത്സയുമായി ബന്ധപ്പെട്ട് ചോദ്യങ്ങൾ ചോദിക്കാനും, എന്റെ ആശങ്കകൾ ഡോക്ടറുമായി ചർച്ച ചെയ്യാനും എനിക്ക് അവസരം ലഭിച്ചിട്ടുണ്ട്. തിരഞ്ഞെടുത്ത അനസ്തേഷ്യ മൂലം ഉണ്ടാകാവുന്ന കോംപ്ലിക്കേഷൻസും പാർശ്വഫലങ്ങളും, ക്രൗൺ നടപടിക്രമത്തിനിടയിലോ അതിനുശേഷമോ ഒരാൾക്ക് പ്രതീക്ഷിക്കാവുന്നതോ സംഭവിക്കാവുന്നതോ ആയ സങ്കീർണ്ണതകളും ക്രൗൺ ഡീസിമെന്റേഷൻ ഉൾപ്പെടെ എനിക്ക് വിശദീകരിച്ചു തന്നു.\n\nകൺസൾട്ടേഷനിൽ എനിക്ക് അവതരിപ്പിച്ച ചികിത്സാരീതിക്കും, എനിക്ക് വിവരിച്ചു തന്ന പ്രകാരം ഞാൻ ഇതിനാൽ സമ്മതിക്കുന്നു. ഈ സമ്മതപത്രം ഞാൻ വായിക്കുകയും പൂർണ്ണമായി മനസ്സിലാക്കുകയും ചെയ്തിട്ടുണ്ടെന്ന് ഞാൻ ഇതിനാൽ സാക്ഷ്യപ്പെടുത്തുന്നു."
    },
    "rpd_cd_crown_bridge": {
      "title": "ഊരിയെടുക്കാവുന്ന വെപ്പ് പല്ല് (ഭാഗികമായ/ മുഴുവൻ പല്ല് സെറ്റ് ), ക്യാപ്, ബ്രിഡ്ജ് ചികിത്സ സമ്മതപത്രം",
      "sections": [],
      "text": "ഞാൻ / എന്റെ രോഗിയുടെ രക്ഷിതാവ് / സഹായിയായി, ഊരിയെടുക്കാവുന്ന വെപ്പ് പല്ല് (ഭാഗികമായ/ മുഴുവൻ പല്ല് സെറ്റ് ), ക്യാപ്, ബ്രിഡ്ജ് ഇടുന്ന ചികിത്സയുടെ സ്വഭാവം, രീതി, ലഭ്യമായ ബദൽ മാർഗങ്ങൾ, നടപടിക്രമങ്ങൾ, ഏകദേശ സമയം, നേട്ടങ്ങൾ, വരാൻ സാധ്യതയുള്ള ബുദ്ധിമുട്ടുകൾ, തുടർനടപടികൾ, സ്വയം പരിചരണത്തിന്റെ ആവശ്യകത എന്നിവ മനസ്സിലാക്കുന്നു. ചികിത്സയുടെ അപ്പോയിന്റ്മെന്റുകൾ കൃത്യമായി ശ്രദ്ധിക്കൽ, ചികിത്സയ്ക്കിടെയും ശേഷവും വായുടെ ശുചിത്വം പാലിക്കേണ്ടതിന്റെ പ്രാധാന്യം എന്നിവയെപ്പറ്റി ഡോക്ടർ അറിയിച്ചു.\n\nഇതിൽ വിവരിച്ചിട്ടുള്ള കാര്യങ്ങൾ ശ്രദ്ധിക്കണം എന്നും പ്രതിപാദിച്ചിട്ടുള്ളതോ, അപൂർവമായി വരാൻ ഇടയുള്ള ബുദ്ധിമുട്ടുകളോ ഉണ്ടാകാമെന്നും ഞാൻ മനസ്സിലാക്കുന്നു. ചികിത്സയുമായി ബന്ധപ്പെട്ട ചോദ്യങ്ങൾ ചോദിക്കാനും, സംശയദൂരീകരണത്തിനും എനിക്ക് അവസരം ലഭിച്ചിട്ടുണ്ട്.\n\nനിലനിർത്താൻ കഴിയാത്ത വിധം മോശമായ പല്ല് / പല്ലുകൾ, അല്ലെങ്കിൽ റൂട്ട് കനാൽ അല്ലെങ്കിൽ മോണ ശസ്ത്രക്രിയ ചെയ്തു നിലനിർത്താമായിരുന്ന പല്ല്/പല്ലുകൾ എന്റെ ആവശ്യപ്രകാരം എടുത്തു മാറ്റിയതാണ്.\n\nപല്ല് നഷ്ടപ്പെട്ട ഭാഗത്ത് പുതിയ പല്ല് വെക്കേണ്ടതിന്റെ ആവശ്യകതയും വെക്കാതെ ഇരുന്നാൽ ഉള്ള ദോഷവശങ്ങളും മനസ്സിലാക്കി പൂർണ സമ്മതത്തോടെയാണ് ഞാൻ പല്ല് സെറ്റ് വെക്കുന്നത്.\n\nപല്ല് എടുത്തതിന് ശേഷം നല്ല രീതിയിൽ മോണ ഉറക്കാനും ഉണങ്ങാനും ഏകദേശം 45 - 90 ദിവസം എടുക്കും എന്നും, ആ കാലയളവിനു ശേഷം പല്ല് സെറ്റ് വെക്കുന്നതാണ് ഉത്തമം എന്നും, ആ കാലയളവ് കഴിയുന്നതിനു മുമ്പ് സെറ്റ് വെച്ചാൽ ഉണ്ടാകാവുന്ന പാർശ്വഫലങ്ങളെ പറ്റി ഡോക്ടർ വിശദീകരിച്ചിട്ടുണ്ട്.\n\nമുഴുവൻ പല്ലുകൾ എടുത്ത സാഹചര്യത്തിൽ മോണ ഉണങ്ങുവാൻ 3 മാസം എടുക്കാം എന്ന് പറഞ്ഞു തന്നിട്ടുണ്ട്. ആ കാലയളവിൽ മോണ മസ്സാജ് ചെയ്യേണ്ട രീതി പറഞ്ഞു തന്നിട്ടുണ്ട്. ചില അവസരങ്ങളിൽ മോണ ഉറക്കുന്നതിന് ശേഷം പോലും എല്ലുകൾ കൂർത്തു നിൽക്കാം എന്നും, അത് മസ്സാജ് ചെയ്തതിലൂടെ ശരിയാകുന്നില്ലെങ്കിൽ ചെറിയ ഒരു ശസ്ത്രക്രിയ നടത്തി ശരിയാക്കണം എന്നും ഞാൻ മനസ്സിലാക്കുന്നു. മോണ ഉറക്കുന്നതിനു മുമ്പ് സെറ്റ് വെച്ചാൽ പെട്ടെന്ന് തന്നെ അയവ് വരാം എന്നും അങ്ങനെ സംഭവിച്ചാൽ ചിലപ്പോൾ പുതിയ സെറ്റ് ഉണ്ടാക്കേണ്ടതായി വരാം എന്നും ഡോക്ടർ പറഞ്ഞു തന്നിട്ടുണ്ട്.\n\nകൃത്രിമ പല്ലുകളുടെ വകഭേദങ്ങളും അവയുടെ ഗുണദോഷ വശങ്ങളും ഏകദേശ ചിലവും ഞാൻ മനസ്സിലാക്കി എന്റെ സ്വന്തം ഇഷ്ടപ്രകാരം ഉള്ള സെറ്റ് പല്ലാണ് ഞാൻ തിരഞ്ഞെടുത്തിരിക്കുന്നത്.\n\nഊരി മാറ്റി വെക്കുന്ന പല്ല് സെറ്റുകൾക്ക് കാലക്രമേണ എല്ലിന് തേയ്മാനം വരുന്നതിനനുസരിച്ച് അയവ് ഉണ്ടാകാം എന്നും, ആദ്യമായി/ പുതുതായി വെച്ച സെറ്റ് പല്ല് മോണയിൽ വേദനയോ മുറിവോ ഉണ്ടാക്കാം എന്നും, അത് ഡോക്ടറെ പലവട്ടം കണ്ടു ശരിയാക്കേണ്ടതായി വരാം എന്നും ഡോക്ടർ പറഞ്ഞു തന്നിട്ടുണ്ട്. സംസാരിക്കാനും ഭക്ഷണം കഴിക്കാനും തുടക്കത്തിൽ ബുദ്ധിമുട്ട് ഉണ്ടാകാം എന്നും, തുടർച്ചയായ ഉപയോഗത്തിലൂടെ മാത്രമേ സൗകര്യമായി ഉപയോഗിക്കാനും ബുദ്ധിമുട്ടുകൾ പരിഹരിക്കാനും സാധിക്കൂ എന്നും ഡോക്ടർ വിശദീകരിച്ചിട്ടുണ്ട്.\n\nപല്ല് സെറ്റ് ഉപയോഗിക്കേണ്ട രീതിും ശ്രദ്ധിക്കേണ്ട കാര്യങ്ങളും ഡോക്ടർ പറഞ്ഞു തന്നിട്ടുണ്ട്. 6 മാസത്തിൽ ഒരിക്കൽ ഡോക്ടറെ കണ്ടു ചെക്കപ്പ് ചെയ്യേണ്ടതിന്റെ ആവശ്യകതയും പറഞ്ഞു തന്നിട്ടുണ്ട്. കാലക്രമേണ സെറ്റിൽ മാറ്റവും തേയ്മാനവും ഉണ്ടാകുമെന്ന് ഞാൻ മനസ്സിലാക്കുന്നു.\n\nഉറപ്പിച്ച് വെക്കുന്ന പല്ലുകൾ (ബ്രിഡ്ജ്) വെക്കുന്നതിനായി തൊട്ടടുത്തുള്ള രണ്ടോ അതിൽ അധികമോ ആയ പല്ലുകൾ കട്ട് ചെയ്ത് ചെറുതാക്കണം എന്നും, നഷ്ടപ്പെട്ട പല്ല് അടുത്തുള്ള പല്ലുകളുടെ ക്യാപ്പിൽ ചേർത്താണ് വെക്കുന്നത് എന്നും ഞാൻ മനസ്സിലാക്കുന്നു. സപ്പോർട്ടിനായി എടുക്കുന്ന പല്ലുകൾക്ക് ഏതെങ്കിലും വിധത്തിലുള്ള കേടുകളോ മോണരോഗമോ ഉണ്ടെങ്കിൽ ആ പല്ലുകൾ റൂട്ട് കനാൽ ട്രീറ്റ്മെന്റ് എടുത്ത ശേഷം ചെയ്യുന്നതാണ് ഉത്തമം എന്നും, അല്ലാത്ത പക്ഷം പെട്ടെന്ന് തന്നെ പുളിപ്പോ വേദനയോ അനുഭവപ്പെടാം എന്നും ഞാൻ മനസ്സിലാക്കുന്നു.\n\nബ്രിഡ്ജ് / റൂട്ട് കനാൽ ചികിത്സയ്ക്ക് ശേഷം ഇട്ട ക്യാപ് ഉള്ള പല്ലുകൾ വൃത്തിയായി സൂക്ഷിക്കേണ്ടതിന്റെ ആവശ്യകതയും, സ്വയം പരിചരണം (മൗത്ത് വാഷ്, ഫ്ലോസിംഗ്, ബ്രഷിംഗ്), 6 മാസം കൂടുമ്പോൾ ഉള്ള ക്ലീനിംഗ് തുടങ്ങിയ കാര്യങ്ങൾ ഡോക്ടർ പറഞ്ഞു തന്നിട്ടുണ്ട്. അല്ലാത്ത പക്ഷം പല്ലുകൾക്കിടയിൽ ഭക്ഷണം കുടുങ്ങാനും, മോണരോഗം വരാനും, പല്ലുകൾക്ക് ഇളക്കമോ, അടുത്തുള്ള പല്ലുകൾക്ക് കേടോ, ക്യാപ് ഇട്ട പല്ലിനു തന്നെ കേടോ വരാം എന്നും ഞാൻ മനസ്സിലാക്കുന്നു.\n\nഒരു പരിധിയിൽ കൂടുതലായി കട്ടി ഉള്ള വസ്തുക്കൾ കടിച്ചാൽ ക്യാപ് പൊട്ടാനും, ഊരി പോകാനും, സെറാമിക് അടർന്നു പോകാനും സാധ്യത ഉണ്ട്. കാലക്രമേണ ക്യാപ് ലൂസ് ആയി ഇളകി വരാം എന്നും ഞാൻ മനസ്സിലാക്കുന്നു.\n\nമുകളിൽ പറഞ്ഞ കാര്യങ്ങൾ മനസ്സിലാക്കി പൂർണ ബോധ്യത്തോടെയാണ് ഊരിയെടുക്കാവുന്ന വെപ്പ് പല്ല് (ഭാഗികമായ/ മുഴുവൻ പല്ല് സെറ്റ്), ക്യാപ്, ബ്രിഡ്ജ് ചികിത്സയ്ക്ക് ഞാൻ സമ്മതം നൽകുന്നത്."
    }
  }
};
