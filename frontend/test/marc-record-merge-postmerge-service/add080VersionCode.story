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



Adds to 080 subfield { ‡21974/fin/fennica }  if 080 already exist and subfield 2 does not exist
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
080    ‡a688/689‡21974/fin/fennica‡9FENNI<KEEP>
100    ‡aTest Author



Does not add to 080 subfield { |2 1947/fin/fennica }  if 080 already has subfield 2
Preferred record:
LDR    00000_a____
001    28474
100    ‡aTest Author

Other record:
LDR    00000_a____
001    28475
080    ‡a688/689‡2TEST‡9FENNI<KEEP>
100    ‡aTest Author

Merged record before postmerge:
LDR    00000_a____
001    28475
080    ‡a688/689‡2TEST‡9FENNI<KEEP>
100    ‡aTest Author

Expected record after postmerge:
LDR    00000_a____
001    28475
080    ‡a688/689‡2TEST‡9FENNI<KEEP>
100    ‡aTest Author



Does not add to 080 subfield { |2 1947/fin/fennica }  if 080 it already has it
Preferred record:
LDR    00000_a____
001    28474
080    ‡a688/689‡21974/fin/fennica‡9FENNI<KEEP>
100    ‡aTest Author

Other record:
LDR    00000_a____
001    28475
080    ‡a688/689‡21974/fin/fennica‡9FENNI<KEEP>
100    ‡aTest Author

Merged record before postmerge:
LDR    00000_a____
001    28475
080    ‡a688/689‡21974/fin/fennica‡9FENNI<KEEP>
100    ‡aTest Author

Expected record after postmerge:
LDR    00000_a____
001    28475
080    ‡a688/689‡21974/fin/fennica‡9FENNI<KEEP>
100    ‡aTest Author