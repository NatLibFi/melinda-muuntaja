Candidate is valid if the preferred does not have subrecords
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author
245    ‡aSome content

Preferred has subrecords: false
Expected to be valid: true



Candidate is invalid if the preferred record has subrecords
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author
245    ‡aSome content

Other record:
LDR    00000da____
001    28474
100    ‡aTest Author
245    ‡aSome content

Preferred has subrecords: true
Expected to be valid: false
Expected failure message: Preferred record has subrecords
