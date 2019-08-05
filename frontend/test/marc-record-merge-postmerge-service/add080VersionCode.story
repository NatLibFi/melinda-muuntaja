Does not add 080 if 080 does not exist
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author

Other record:
LDR    00000_a____
001    28475
100    ‡aTest Author

Merged record before postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author

Expected record after postmerge:
LDR    00000_a____
001    28475
100    ‡aTest Author



Adds to 080 subfields |2 1947/fin/fennica if 080 allready exist
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author

Other record:
LDR    00000_a____
001    28475
080    ‡a688/689‡9FENNI<KEEP>
100    ‡aTest Author

Merged record before postmerge:
LDR    00000_a____
001    28475
080    ‡a688/689‡9FENNI<KEEP>
100    ‡aTest Author

Expected record after postmerge:
LDR    00000_a____
001    28475
080    ‡a688/689‡9FENNI<KEEP>‡21974/fin/fennica
100    ‡aTest Author