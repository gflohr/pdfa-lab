import { rdfLiteral } from '../../../../rdf/rdf-schema.js';

/**
 * Part
 *
 * A Unicode string that identifies a portion of a resource. This is typically
 * a general or logical portion, rather than a specific physical portion. For
 * example, the metadata or the content, or the audio portion of a movie or the
 * video portion.
 *
 * Part names are a hierarchy of arbitrary depth, specified using path syntax
 * where levels in the hierarchy shall be indicated by a slash ("/", U+002F).
 * The slash shall not be used for any other purpose in these strings. The
 * leftmost character shall be a slash. A path may be just a slash, indicating
 * any or all parts.
 *
 * All paths implicitly encompass further descendants. For example, `/content`
 * includes all content, whereas `/content/audio` includes all audio but
 * excludes other content such as `/content/video`. The collection of part
 * components is open. Additional levels of subparts or alternatives for
 * existing levels may be used; for example, `/content/audio/channels/left` or
 * `/content/audio/FFTaudio/high`. When such subparts are used, each subpart
 * name shall be unique and signify a component that is disjoint from any of
 * its siblings.
 *
 * A part component name shall follow a restricted syntax of an XML Name as
 * defined in Extensible Markup Language. At most one colon (":" U+003A) shall
 * be used, and a colon shall not be the first character. Of the XML Name
 * characters below U+0080, only "A" through "Z", "a" through "z", "0" through
 * "9", and colon may be used. Other XML Name characters below U+0080 are
 * reserved for future use. XMP readers should tolerate reserved characters,
 * and should ignore the remainder of a path from the leftmost component
 * containing a reserved character.
 *
 * The following table lists part component names that are explicitly defined:
 *
 * | Part specification              | Part that changed or is referenced     |
 * |---------------------------------|----------------------------------------|
 * | `/`                             |  Any (specific part unknown) or all (all parts of the content and metadata).
 * | `/metadata`                     |  Portions of the metadata.             |
 * | `/content`                      | Any or all of the content (non-metadata). |
 * | `/content/audio`                | Any or all sound.                      |
 * | `/content/visual`               | Some image data (video or still).      |
 * | `/content/visual/video`         | Video or animation.                    |
 * | `/content/visual/raster`        | Static raster image.                   |
 * | `/content/visual/vector`        | Static vector image.                   |
 * | `/content/visual/form/data`     | Form field data.                       |
 * | `/content/visual/form/template` | Form template.                         |
 * | `/content/visual/annots`        | Applied annotations (comments).        |
 * | `[/]time:##`                    | A time, duration, or time range        |
 * | `[/]time:##d##`                 | specifier. May be standalone (meaning  |
 * | `[/]time:##r##`                 | all parts starting at the time or      |
 * |                                 | within the range specified) or may be  |
 * |                                 | added to any of the listed             |
 * |                                 | specifications.                        |
 * |                                 | * `##` The start time, a frame count   |
 * |                                 | * `##d##` Duration (start time and duration time) |
 * |                                 | * `##r##` Range (start time and end time) |
 * |                                 | Each ## value is a FrameCount          |
 * |                                 | specifier, which can include an        |
 * |                                 | optional frame rate. The default frame |
 * |                                 | rate is 1fps. The default duration is  |
 * |                                 | "maximum", the entire length of the    |
 * |                                 | asset.                                 |
 * |                                 | In a fromPart or toPart value, the     |
 * |                                 | leading `/` is optional. For an        |
 * |                                 | `stEvt:changed` part descriptor in a.  |
 * |                                 | history record, the leading `/` is.    |
 * |                                 | required.                              |
 * |                                 | For a fromPart value, the start time   |
 * |                                 | is an offset from the start of the     |
 * |                                 | current ingredient’s file. For a       |
 * |                                 | toPart value, the start time is        |
 * |                                 | measured from the start of the         |
 * |                                 | destination file. If time values are   |
 * |                                 | not specifically given, the default    |
 * |                                 | start time is 0, meaning the beginning |
 * |                                 | of the relevant file.
 */
export const xmpPart = rdfLiteral('Part');
